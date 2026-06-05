const db = require('../config/db');
const supabase = require('../config/supabase');
const { AppError } = require('../utils/errors');

const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'product-images';

const makeSlug = (value) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

const parseJsonArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const parseTextArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  const jsonArray = parseJsonArray(value);
  if (jsonArray.length) return jsonArray;

  if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
    return value
      .slice(1, -1)
      .split(',')
      .map(item => item.replace(/^"|"$/g, '').trim())
      .filter(Boolean);
  }

  return [];
};

const sanitizeFileName = (fileName = 'image') => (
  String(fileName)
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'image'
);

const createStorageFileName = (originalName) => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  return `${timestamp}-${random}-${sanitizeFileName(originalName)}`;
};

const uploadImageToSupabase = async (file) => {
  if (!file?.buffer) {
    throw new AppError('Image file buffer is required', 400);
  }

  const fileName = createStorageFileName(file.originalname);
  const { error: uploadError } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    throw new AppError(`Supabase upload failed: ${uploadError.message}`, 500);
  }

  const { data } = supabase.storage
    .from(SUPABASE_BUCKET)
    .getPublicUrl(fileName);

  if (!data?.publicUrl) {
    throw new AppError('Unable to get uploaded image public URL', 500);
  }

  return {
    url: data.publicUrl,
    filename: fileName,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype
  };
};

const visibleReviewWhere = '(is_approved = true OR is_verified_purchase = true)';
const reviewStatsJoin = `LEFT JOIN (
  SELECT product_id, ROUND(AVG(rating), 2) as average_rating, COUNT(*) as review_total
  FROM reviews
  WHERE ${visibleReviewWhere}
  GROUP BY product_id
) rs ON rs.product_id = p.id`;
const reviewRatingExpr = 'COALESCE(rs.average_rating, p.rating, 0)';
const reviewCountExpr = 'COALESCE(rs.review_total, p.review_count, 0)';

const applyReviewStats = (product) => {
  product.rating = Number(product.computed_rating ?? product.rating ?? 0);
  product.review_count = Number(product.computed_review_count ?? product.review_count ?? 0);
  delete product.computed_rating;
  delete product.computed_review_count;
  return product;
};

const addParam = (params, value) => {
  params.push(value);
  return `$${params.length}`;
};

const normalizeSearchTerm = (value = '') => String(value)
  .trim()
  .replace(/\s+/g, ' ')
  .slice(0, 120);

const normalizeTags = (value) => {
  const tags = parseTextArray(value);
  return [...new Set(tags
    .map(tag => String(tag).trim())
    .filter(Boolean)
    .slice(0, 30))];
};

const parsePositiveInt = (value, fallback, max = 100) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
};

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getSearchSessionId = (req) => {
  const sessionId = req.get('x-search-session-id');
  if (!sessionId || sessionId.length > 80) return null;
  return /^[a-zA-Z0-9._:-]+$/.test(sessionId) ? sessionId : null;
};

const serializeProduct = (product) => {
  applyReviewStats(product);
  product.images = parseJsonArray(product.images);
  product.specifications = parseJsonArray(product.specifications);
  product.tags = parseTextArray(product.tags);
  if (product.search_score !== undefined) product.search_score = Number(product.search_score || 0);
  if (product.full_text_rank !== undefined) product.full_text_rank = Number(product.full_text_rank || 0);
  if (product.fuzzy_rank !== undefined) product.fuzzy_rank = Number(product.fuzzy_rank || 0);
  if (product.ctr !== undefined) product.ctr = Number(product.ctr || 0);
  return product;
};

const getSearchCorrection = async (query) => {
  const tokens = query.match(/[a-z0-9]+/gi)
    ?.map(token => token.toLowerCase())
    .filter(token => token.length > 2)
    .slice(0, 8) || [];

  if (!tokens.length) {
    return { correctedQuery: null, corrections: [] };
  }

  const corrections = await db.query(
    `WITH input_tokens AS (
       SELECT token, ordinality
       FROM unnest($1::text[]) WITH ORDINALITY AS tokens(token, ordinality)
     ),
     dictionary AS (
       SELECT DISTINCT lower(trim(term)) as normalized_term, trim(term) as display_term
       FROM (
         SELECT brand as term FROM products WHERE brand IS NOT NULL AND is_active = true
         UNION ALL
         SELECT name as term FROM products WHERE is_active = true
         UNION ALL
         SELECT regexp_split_to_table(name, '[^[:alnum:]]+') as term FROM products WHERE is_active = true
         UNION ALL
         SELECT regexp_split_to_table(coalesce(brand, ''), '[^[:alnum:]]+') as term FROM products WHERE is_active = true
         UNION ALL
         SELECT c.name as term FROM categories c WHERE c.is_active = true
         UNION ALL
         SELECT regexp_split_to_table(c.name, '[^[:alnum:]]+') as term FROM categories c WHERE c.is_active = true
         UNION ALL
         SELECT unnest(tags) as term FROM products WHERE is_active = true
       ) terms
       WHERE term IS NOT NULL AND length(trim(term)) > 2
     ),
     best_matches AS (
       SELECT DISTINCT ON (it.ordinality)
         it.token,
         it.ordinality,
         d.display_term,
         similarity(d.normalized_term, it.token) as score
       FROM input_tokens it
       JOIN dictionary d ON true
       WHERE NOT EXISTS (
         SELECT 1 FROM dictionary exact_terms
         WHERE exact_terms.normalized_term = it.token
       )
       AND (
         similarity(d.normalized_term, it.token) >= 0.36
         OR d.normalized_term LIKE it.token || '%'
       )
       ORDER BY it.ordinality,
         CASE WHEN d.normalized_term LIKE it.token || '%' THEN 1 ELSE 0 END DESC,
         similarity(d.normalized_term, it.token) DESC,
         length(d.display_term) ASC
     )
     SELECT token, display_term, score
     FROM best_matches
     WHERE score >= 0.36 OR lower(display_term) LIKE token || '%'
     ORDER BY ordinality`,
    [tokens]
  );

  if (!corrections.length) {
    return { correctedQuery: null, corrections: [] };
  }

  let correctedQuery = query;
  corrections.forEach(({ token, display_term: displayTerm }) => {
    correctedQuery = correctedQuery.replace(new RegExp(`\\b${escapeRegExp(token)}\\b`, 'i'), displayTerm);
  });

  if (correctedQuery.toLowerCase() === query.toLowerCase()) {
    return { correctedQuery: null, corrections: [] };
  }

  return { correctedQuery, corrections };
};

const recordSearchQuery = async (req, query, correctedQuery, resultCount) => {
  try {
    const sessionId = getSearchSessionId(req);
    const normalizedQuery = query.toLowerCase();
    const rows = await db.query(
      `WITH inserted AS (
         INSERT INTO search_queries (user_id, session_id, query, normalized_query, corrected_query, result_count)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id
       ),
       upserted AS (
         INSERT INTO search_terms (normalized_query, display_query, search_count, result_count, last_searched_at)
         VALUES ($4, $3, 1, $6, NOW())
         ON CONFLICT (normalized_query) DO UPDATE SET
           display_query = EXCLUDED.display_query,
           search_count = search_terms.search_count + 1,
           result_count = EXCLUDED.result_count,
           last_searched_at = NOW()
         RETURNING normalized_query
       )
       SELECT id FROM inserted`,
      [req.user?.id || null, sessionId, query, normalizedQuery, correctedQuery || null, resultCount]
    );

    return rows[0]?.id || null;
  } catch (error) {
    console.warn('Search history write failed:', error.message);
    return null;
  }
};

const recordProductImpressions = async (productIds) => {
  if (!productIds.length) return;

  try {
    await db.query(
      `INSERT INTO product_search_metrics (product_id, impressions, last_impression_at)
       SELECT unnest($1::int[]), 1, NOW()
       ON CONFLICT (product_id) DO UPDATE SET
         impressions = product_search_metrics.impressions + 1,
         last_impression_at = NOW(),
         updated_at = NOW()`,
      [productIds]
    );
  } catch (error) {
    console.warn('Search impression write failed:', error.message);
  }
};

const getUniqueCategorySlug = async (name, excludeId = null) => {
  const slugBase = makeSlug(name);
  if (!slugBase) {
    throw new AppError('Category name must contain letters or numbers', 400);
  }

  let slug = slugBase;
  let suffix = 2;

  while (true) {
    const params = [slug];
    let sql = 'SELECT id FROM categories WHERE slug = $1';

    if (excludeId) {
      params.push(excludeId);
      sql += ` AND id != $${params.length}`;
    }

    sql += ' LIMIT 1';

    const existingSlug = await db.query(sql, params);
    if (!existingSlug.length) break;

    slug = `${slugBase}-${suffix}`;
    suffix += 1;
  }

  return slug;
};

const listProducts = async (req, res, next) => {
  try {
    const {
      category, minPrice, maxPrice,
      rating, sort, page = 1, limit = 12,
      featured, status = 'active'
    } = req.query;
    const pageNumber = parsePositiveInt(page, 1, 100000);
    const limitNumber = parsePositiveInt(limit, 12, 100);

    const productJoin = `FROM products p LEFT JOIN categories c ON p.category_id = c.id LEFT JOIN categories pc ON c.parent_id = pc.id ${reviewStatsJoin}`;
    let sql = `SELECT p.*, ${reviewRatingExpr} as computed_rating, ${reviewCountExpr} as computed_review_count, c.name as category_name, c.slug as category_slug ${productJoin} WHERE p.is_active = true`;
    let countSql = `SELECT COUNT(*) as total ${productJoin} WHERE p.is_active = true`;
    const params = [];
    const countParams = [];

    if (status === 'active') {
      sql += ` AND p.status = ${addParam(params, 'active')}`;
      countSql += ` AND p.status = ${addParam(countParams, 'active')}`;
    }

    if (category) {
      sql += ` AND (c.slug = ${addParam(params, category)} OR c.parent_id = (SELECT id FROM categories WHERE slug = ${addParam(params, category)}))`;
      countSql += ` AND (c.slug = ${addParam(countParams, category)} OR c.parent_id = (SELECT id FROM categories WHERE slug = ${addParam(countParams, category)}))`;
    }

    if (minPrice) {
      sql += ` AND p.price >= ${addParam(params, parseFloat(minPrice))}`;
      countSql += ` AND p.price >= ${addParam(countParams, parseFloat(minPrice))}`;
    }

    if (maxPrice) {
      sql += ` AND p.price <= ${addParam(params, parseFloat(maxPrice))}`;
      countSql += ` AND p.price <= ${addParam(countParams, parseFloat(maxPrice))}`;
    }

    if (rating) {
      sql += ` AND ${reviewRatingExpr} >= ${addParam(params, parseFloat(rating))}`;
      countSql += ` AND ${reviewRatingExpr} >= ${addParam(countParams, parseFloat(rating))}`;
    }

    if (featured === 'true') {
      sql += ' AND p.is_featured = true';
      countSql += ' AND p.is_featured = true';
    }

    const sortOptions = {
      'price_asc': 'p.price ASC',
      'price_desc': 'p.price DESC',
      'newest': 'p.created_at DESC',
      'popular': 'p.sales_count DESC',
      'rating': `${reviewRatingExpr} DESC`,
      'relevance': 'p.created_at DESC',
      'name': 'p.name ASC'
    };
    sql += ' ORDER BY ' + (sortOptions[sort] || 'p.created_at DESC');

    const offset = (pageNumber - 1) * limitNumber;
    sql += ` LIMIT ${addParam(params, limitNumber)} OFFSET ${addParam(params, offset)}`;

    const products = await db.query(sql, params);
    products.forEach(serializeProduct);

    const countResult = await db.query(countSql, countParams);
    const total = Number(countResult[0].total || 0);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    next(error);
  }
};

const searchProducts = async (req, res, next, searchTerm) => {
  try {
    const {
      category, minPrice, maxPrice,
      rating, sort, page = 1, limit = 12,
      featured, status = 'active'
    } = req.query;
    const pageNumber = parsePositiveInt(page, 1, 100000);
    const limitNumber = parsePositiveInt(limit, 12, 100);
    const correction = await getSearchCorrection(searchTerm);
    const effectiveSearch = correction.correctedQuery || searchTerm;

    const createFilterClauses = (params) => {
      const clauses = ['p.is_active = true'];

      if (status === 'active') {
        clauses.push(`p.status = ${addParam(params, 'active')}`);
      }

      if (category) {
        clauses.push(`(c.slug = ${addParam(params, category)} OR pc.slug = ${addParam(params, category)} OR c.parent_id = (SELECT id FROM categories WHERE slug = ${addParam(params, category)}))`);
      }

      if (minPrice) {
        clauses.push(`p.price >= ${addParam(params, parseFloat(minPrice))}`);
      }

      if (maxPrice) {
        clauses.push(`p.price <= ${addParam(params, parseFloat(maxPrice))}`);
      }

      if (rating) {
        clauses.push(`${reviewRatingExpr} >= ${addParam(params, parseFloat(rating))}`);
      }

      if (featured === 'true') {
        clauses.push('p.is_featured = true');
      }

      clauses.push(`(
        p.search_vector @@ si.tsq
        OR to_tsvector('english', concat_ws(' ', c.name, c.slug, pc.name, pc.slug)) @@ si.tsq
        OR lower(p.name) LIKE '%' || lower(si.original_query) || '%'
        OR lower(p.name) LIKE '%' || lower(si.corrected_query) || '%'
        OR lower(coalesce(p.brand, '')) LIKE '%' || lower(si.original_query) || '%'
        OR lower(coalesce(p.brand, '')) LIKE '%' || lower(si.corrected_query) || '%'
        OR lower(coalesce(c.name, '')) LIKE '%' || lower(si.corrected_query) || '%'
        OR lower(coalesce(pc.name, '')) LIKE '%' || lower(si.corrected_query) || '%'
        OR lower(array_to_string(coalesce(p.tags, '{}'::text[]), ' ')) LIKE '%' || lower(si.corrected_query) || '%'
        OR lower(p.name) % lower(si.original_query)
        OR lower(p.name) % lower(si.corrected_query)
        OR lower(coalesce(p.brand, '')) % lower(si.original_query)
        OR lower(coalesce(c.name, '')) % lower(si.original_query)
        OR lower(array_to_string(coalesce(p.tags, '{}'::text[]), ' ')) % lower(si.original_query)
      )`);

      return clauses.join(' AND ');
    };

    const params = [searchTerm, effectiveSearch];
    const countParams = [searchTerm, effectiveSearch];
    const searchInput = `WITH search_input AS (
      SELECT
        $1::text as original_query,
        $2::text as corrected_query,
        websearch_to_tsquery('english', $2::text) as tsq
    )`;
    const productJoin = `FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN categories pc ON c.parent_id = pc.id
      ${reviewStatsJoin}
      LEFT JOIN product_search_metrics psm ON psm.product_id = p.id
      CROSS JOIN search_input si`;
    const whereSql = createFilterClauses(params);
    const countWhereSql = createFilterClauses(countParams);
    const fuzzyRankExpr = `GREATEST(
      similarity(lower(p.name), lower(si.original_query)),
      similarity(lower(p.name), lower(si.corrected_query)),
      similarity(lower(coalesce(p.brand, '')), lower(si.original_query)),
      similarity(lower(coalesce(p.brand, '')), lower(si.corrected_query)),
      similarity(lower(coalesce(c.name, '')), lower(si.corrected_query)),
      similarity(lower(coalesce(pc.name, '')), lower(si.corrected_query)),
      similarity(lower(array_to_string(coalesce(p.tags, '{}'::text[]), ' ')), lower(si.corrected_query))
    )`;
    const scoreExpr = `(
      CASE WHEN lower(p.name) IN (lower(si.original_query), lower(si.corrected_query)) THEN 120 ELSE 0 END
      + CASE WHEN lower(coalesce(p.brand, '')) IN (lower(si.original_query), lower(si.corrected_query)) THEN 90 ELSE 0 END
      + CASE WHEN lower(coalesce(c.name, '')) IN (lower(si.original_query), lower(si.corrected_query)) THEN 75 ELSE 0 END
      + CASE WHEN lower(p.name) LIKE lower(si.corrected_query) || '%' THEN 60 ELSE 0 END
      + CASE WHEN lower(p.name) LIKE '%' || lower(si.corrected_query) || '%' THEN 35 ELSE 0 END
      + CASE WHEN lower(coalesce(p.brand, '')) LIKE '%' || lower(si.corrected_query) || '%' THEN 30 ELSE 0 END
      + CASE WHEN lower(coalesce(c.name, '')) LIKE '%' || lower(si.corrected_query) || '%' THEN 25 ELSE 0 END
      + (ts_rank(p.search_vector, si.tsq, 32) * 60)
      + (ts_rank(to_tsvector('english', concat_ws(' ', c.name, pc.name)), si.tsq, 32) * 25)
      + (${fuzzyRankExpr} * 35)
      + (LEAST(COALESCE(p.popularity_score, 0), 100) * 0.15)
      + (LEAST(COALESCE(p.sales_count, 0), 10000) * 0.002)
      + (COALESCE(${reviewRatingExpr}, 0) * 2)
      + (LEAST(COALESCE(psm.ctr, 0), 1) * 15)
      + CASE WHEN p.is_featured THEN 3 ELSE 0 END
    )`;

    const sortOptions = {
      'relevance': `search_score DESC, p.created_at DESC`,
      'price_asc': `p.price ASC, search_score DESC`,
      'price_desc': `p.price DESC, search_score DESC`,
      'newest': `p.created_at DESC, search_score DESC`,
      'popular': `p.sales_count DESC, search_score DESC`,
      'rating': `${reviewRatingExpr} DESC, search_score DESC`,
      'name': `p.name ASC, search_score DESC`
    };
    const orderBy = sortOptions[sort || 'relevance'] || sortOptions.relevance;

    const offset = (pageNumber - 1) * limitNumber;
    const sql = `${searchInput}
      SELECT p.*, ${reviewRatingExpr} as computed_rating, ${reviewCountExpr} as computed_review_count,
        c.name as category_name, c.slug as category_slug,
        ts_rank(p.search_vector, si.tsq, 32) as full_text_rank,
        ${fuzzyRankExpr} as fuzzy_rank,
        COALESCE(psm.ctr, 0) as ctr,
        ${scoreExpr} as search_score
      ${productJoin}
      WHERE ${whereSql}
      ORDER BY ${orderBy}
      LIMIT ${addParam(params, limitNumber)} OFFSET ${addParam(params, offset)}`;

    const countSql = `${searchInput}
      SELECT COUNT(*)::int as total
      ${productJoin}
      WHERE ${countWhereSql}`;

    const [products, countResult] = await Promise.all([
      db.query(sql, params),
      db.query(countSql, countParams)
    ]);
    const total = Number(countResult[0]?.total || 0);
    const searchId = await recordSearchQuery(req, searchTerm, correction.correctedQuery, total);

    products.forEach(product => {
      serializeProduct(product);
      product.search_id = searchId;
      product.search_query = searchTerm;
      product.corrected_search = correction.correctedQuery;
      product.highlight_query = effectiveSearch;
    });

    await recordProductImpressions(products.map(product => product.id));

    res.json({
      success: true,
      data: products,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber)
      },
      search: {
        query: searchTerm,
        correctedQuery: correction.correctedQuery,
        usedQuery: effectiveSearch,
        searchId
      }
    });
  } catch (error) {
    next(error);
  }
};

const getProducts = async (req, res, next) => {
  const searchTerm = normalizeSearchTerm(req.query.search);
  if (searchTerm) {
    return searchProducts(req, res, next, searchTerm);
  }
  return listProducts(req, res, next);
};

const getSearchHistoryData = async (req, limit = 8) => {
  const sessionId = getSearchSessionId(req);
  const ownerValue = req.user?.id || sessionId;
  const ownerColumn = req.user?.id ? 'user_id' : 'session_id';
  const recentSearches = ownerValue
    ? await db.query(
      `SELECT query, corrected_query, result_count, created_at
       FROM (
         SELECT DISTINCT ON (normalized_query)
           query, corrected_query, result_count, created_at
         FROM search_queries
         WHERE ${ownerColumn} = $1
         ORDER BY normalized_query, created_at DESC
       ) recent
       ORDER BY created_at DESC
       LIMIT $2`,
      [ownerValue, limit]
    )
    : [];

  const recentItems = ownerValue
    ? await db.query(
      `SELECT *
       FROM (
         SELECT DISTINCT ON (r.product_id)
           p.id, p.name, p.slug, p.images, p.price, r.query, r.searched_at
         FROM recently_searched_items r
         JOIN products p ON p.id = r.product_id
         WHERE r.${ownerColumn} = $1 AND p.is_active = true
         ORDER BY r.product_id, r.searched_at DESC
       ) recent
       ORDER BY searched_at DESC
       LIMIT $2`,
      [ownerValue, limit]
    )
    : [];

  const trendingSearches = await db.query(
    `SELECT display_query as query, search_count, result_count, last_searched_at
     FROM search_terms
     ORDER BY search_count DESC, last_searched_at DESC
     LIMIT $1`,
    [limit]
  );

  recentItems.forEach(item => {
    item.images = parseJsonArray(item.images);
  });

  return { recentSearches, recentItems, trendingSearches };
};

const getSearchHistory = async (req, res, next) => {
  try {
    const limit = parsePositiveInt(req.query.limit, 8, 20);
    const data = await getSearchHistoryData(req, limit);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getTrendingSearches = async (req, res, next) => {
  try {
    const limit = parsePositiveInt(req.query.limit, 8, 20);
    const trendingSearches = await db.query(
      `SELECT display_query as query, search_count, result_count, last_searched_at
       FROM search_terms
       ORDER BY search_count DESC, last_searched_at DESC
       LIMIT $1`,
      [limit]
    );

    res.json({ success: true, data: trendingSearches });
  } catch (error) {
    next(error);
  }
};

const getSearchSuggestions = async (req, res, next) => {
  try {
    const query = normalizeSearchTerm(req.query.q);
    const limit = parsePositiveInt(req.query.limit, 8, 12);

    if (!query) {
      const history = await getSearchHistoryData(req, limit);
      return res.json({
        success: true,
        data: {
          suggestions: [],
          ...history
        }
      });
    }

    const correction = await getSearchCorrection(query);
    const effectiveQuery = correction.correctedQuery || query;

    const [productRows, brandRows, categoryRows, tagRows, historyRows] = await Promise.all([
      db.query(
        `SELECT 'product' as type, p.name as text, p.slug, p.images, c.name as category_name,
          (
            CASE WHEN lower(p.name) = lower($1) THEN 120 ELSE 0 END
            + CASE WHEN lower(p.name) LIKE lower($1) || '%' THEN 50 ELSE 0 END
            + (ts_rank(p.search_vector, websearch_to_tsquery('english', $2), 32) * 40)
            + (GREATEST(similarity(lower(p.name), lower($1)), similarity(lower(p.name), lower($2))) * 35)
            + (LEAST(COALESCE(p.sales_count, 0), 1000) * 0.01)
          ) as score
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         WHERE p.is_active = true AND p.status = 'active'
           AND (
             p.search_vector @@ websearch_to_tsquery('english', $2)
             OR lower(p.name) LIKE '%' || lower($1) || '%'
             OR lower(p.name) LIKE '%' || lower($2) || '%'
             OR lower(p.name) % lower($1)
           )
         ORDER BY score DESC, p.sales_count DESC
         LIMIT $3`,
        [query, effectiveQuery, limit]
      ),
      db.query(
        `SELECT 'brand' as type, brand as text, NULL::text as slug, NULL::jsonb as images, NULL::text as category_name,
          (90 + similarity(lower(brand), lower($1)) * 30 + COUNT(*) * 0.2) as score
         FROM products
         WHERE brand IS NOT NULL AND is_active = true
           AND (lower(brand) LIKE '%' || lower($1) || '%' OR lower(brand) % lower($1))
         GROUP BY brand
         ORDER BY score DESC
         LIMIT $2`,
        [query, limit]
      ),
      db.query(
        `SELECT 'category' as type, c.name as text, c.slug, NULL::jsonb as images, NULL::text as category_name,
          (80 + similarity(lower(c.name), lower($1)) * 25) as score
         FROM categories c
         WHERE c.is_active = true
           AND (lower(c.name) LIKE '%' || lower($1) || '%' OR lower(c.name) % lower($1))
         ORDER BY score DESC
         LIMIT $2`,
        [query, limit]
      ),
      db.query(
        `SELECT 'tag' as type, tag as text, NULL::text as slug, NULL::jsonb as images, NULL::text as category_name,
          (70 + similarity(lower(tag), lower($1)) * 20 + COUNT(*) * 0.2) as score
         FROM products p
         CROSS JOIN LATERAL unnest(p.tags) tag
         WHERE p.is_active = true
           AND (lower(tag) LIKE '%' || lower($1) || '%' OR lower(tag) % lower($1))
         GROUP BY tag
         ORDER BY score DESC
         LIMIT $2`,
        [query, limit]
      ),
      db.query(
        `SELECT 'search' as type, display_query as text, NULL::text as slug, NULL::jsonb as images,
          NULL::text as category_name,
          (55 + similarity(lower(display_query), lower($1)) * 20 + LEAST(search_count, 1000) * 0.02) as score
         FROM search_terms
         WHERE lower(display_query) LIKE '%' || lower($1) || '%'
           OR lower(display_query) % lower($1)
         ORDER BY score DESC, search_count DESC
         LIMIT $2`,
        [query, limit]
      )
    ]);

    const seen = new Set();
    const suggestions = [...productRows, ...brandRows, ...categoryRows, ...tagRows, ...historyRows]
      .map(row => ({
        ...row,
        images: parseJsonArray(row.images),
        score: Number(row.score || 0)
      }))
      .sort((a, b) => b.score - a.score)
      .filter(row => {
        const key = `${row.type}:${String(row.text).toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, limit);

    res.json({
      success: true,
      data: {
        suggestions,
        correctedQuery: correction.correctedQuery,
        corrections: correction.corrections
      }
    });
  } catch (error) {
    next(error);
  }
};

const recordSearchClick = async (req, res, next) => {
  try {
    const productId = parseInt(req.body.productId, 10);
    const parsedSearchId = req.body.searchId ? parseInt(req.body.searchId, 10) : null;
    const searchId = Number.isNaN(parsedSearchId) ? null : parsedSearchId;
    const query = normalizeSearchTerm(req.body.query);
    const sessionId = getSearchSessionId(req);

    if (Number.isNaN(productId)) {
      throw new AppError('Valid product id is required', 400);
    }

    await db.query(
      `INSERT INTO product_search_metrics (product_id, clicks, last_click_at)
       VALUES ($1, 1, NOW())
       ON CONFLICT (product_id) DO UPDATE SET
         clicks = product_search_metrics.clicks + 1,
         last_click_at = NOW(),
         updated_at = NOW()`,
      [productId]
    );

    await db.query(
      `INSERT INTO recently_searched_items (user_id, session_id, product_id, search_query_id, query)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user?.id || null, sessionId, productId, searchId, query || null]
    );

    res.json({ success: true, message: 'Search click recorded' });
  } catch (error) {
    next(error);
  }
};

const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const products = await db.query(
      `SELECT p.*, ${reviewRatingExpr} as computed_rating, ${reviewCountExpr} as computed_review_count, c.name as category_name, c.slug as category_slug
       FROM products p LEFT JOIN categories c ON p.category_id = c.id ${reviewStatsJoin}
       WHERE p.slug = $1`,
      [slug]
    );

    if (!products.length) {
      throw new AppError('Product not found', 404);
    }

    const product = products[0];
    applyReviewStats(product);
    product.images = parseJsonArray(product.images);
    product.specifications = parseJsonArray(product.specifications);

    const variants = await db.query(
      'SELECT * FROM product_variants WHERE product_id = $1 AND is_active = true',
      [product.id]
    );

    const imageRows = await db.query(
      'SELECT * FROM product_images WHERE product_id = $1 ORDER BY sort_order',
      [product.id]
    );
    const galleryImages = imageRows.length ? imageRows.map(image => image.url) : product.images;

    const reviews = await db.query(
      `SELECT r.*, u.name as user_name, u.avatar as user_avatar
       FROM reviews r JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1 AND (r.is_approved = true OR r.is_verified_purchase = true)
       ORDER BY r.created_at DESC`,
      [product.id]
    );
    reviews.forEach(review => {
      review.images = parseJsonArray(review.images);
    });

    const related = await db.query(
      `SELECT p.id, p.name, p.slug, p.price, p.compare_price, p.images, ${reviewRatingExpr} as computed_rating, ${reviewCountExpr} as computed_review_count
       FROM products p ${reviewStatsJoin}
       WHERE p.category_id = $1 AND p.id != $2 AND p.is_active = true
       LIMIT 6`,
      [product.category_id, product.id]
    );

    related.forEach(p => {
      applyReviewStats(p);
      p.images = parseJsonArray(p.images);
    });

    if (req.user) {
      await db.query(
        'INSERT INTO recently_viewed (user_id, product_id) VALUES ($1, $2)',
        [req.user.id, product.id]
      );
    }

    res.json({
      success: true,
      data: { ...product, images: galleryImages, imageRecords: imageRows, variants, reviews, related }
    });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const {
      name, slug, description, shortDescription, price, comparePrice,
      categoryId, brand, stockQuantity, sku, images, specifications,
      isFeatured, status, discountPercent, taxRate, tags, popularityScore
    } = req.body;

    const result = await db.query(
      `INSERT INTO products (name, slug, description, short_description, price, compare_price,
        category_id, brand, stock_quantity, sku, images, specifications, is_featured, status,
        discount_percent, tax_rate, tags, popularity_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING id`,
      [name, slug, description, shortDescription, price, comparePrice,
        categoryId, brand, stockQuantity, sku,
        images ? JSON.stringify(images) : null,
        specifications ? JSON.stringify(specifications) : null,
        isFeatured || false, status || 'active', discountPercent || 0, taxRate || 0,
        normalizeTags(tags), popularityScore || 0]
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { id: result[0].id }
    });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description, image, parentId } = req.body;
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const parentCategoryId = parentId ? Number(parentId) : null;

    if (!trimmedName) {
      throw new AppError('Category name is required', 400);
    }

    if (parentId && Number.isNaN(parentCategoryId)) {
      throw new AppError('Valid parent category is required', 400);
    }

    const existingByName = await db.query(
      'SELECT * FROM categories WHERE LOWER(name) = LOWER($1) AND parent_id IS NOT DISTINCT FROM $2 LIMIT 1',
      [trimmedName, parentCategoryId]
    );

    if (existingByName.length) {
      return res.json({
        success: true,
        message: 'Category already exists',
        data: existingByName[0]
      });
    }

    const slug = await getUniqueCategorySlug(trimmedName);

    const result = await db.query(
      `INSERT INTO categories (name, slug, description, image, parent_id, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id`,
      [trimmedName, slug, description || null, image || null, parentCategoryId]
    );

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        id: result[0].id,
        name: trimmedName,
        slug,
        description: description || null,
        image: image || null,
        parent_id: parentCategoryId,
        is_active: true
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const categoryId = Number(req.params.id);
    const { name, description, image, parentId } = req.body;

    if (Number.isNaN(categoryId)) {
      throw new AppError('Valid category is required', 400);
    }

    const categories = await db.query(
      'SELECT * FROM categories WHERE id = $1 LIMIT 1',
      [categoryId]
    );

    if (!categories.length) {
      throw new AppError('Category not found', 404);
    }

    const currentCategory = categories[0];
    const nextName = name !== undefined ? String(name).trim() : currentCategory.name;
    let nextParentId = currentCategory.parent_id;

    if (!nextName) {
      throw new AppError('Category name is required', 400);
    }

    if (parentId !== undefined) {
      nextParentId = parentId === null || parentId === '' ? null : Number(parentId);

      if (nextParentId !== null && Number.isNaN(nextParentId)) {
        throw new AppError('Valid parent category is required', 400);
      }
    }

    if (nextParentId !== null) {
      if (nextParentId === categoryId) {
        throw new AppError('A category cannot be its own parent', 400);
      }

      const parents = await db.query(
        'SELECT id, parent_id FROM categories WHERE id = $1 AND is_active = true LIMIT 1',
        [nextParentId]
      );

      if (!parents.length) {
        throw new AppError('Parent category not found', 404);
      }

      if (parents[0].parent_id) {
        throw new AppError('Parent category must be a top-level category', 400);
      }

      const children = await db.query(
        'SELECT COUNT(*)::int as total FROM categories WHERE parent_id = $1 AND is_active = true',
        [categoryId]
      );

      if (children[0].total > 0) {
        throw new AppError('Move or delete subcategories before assigning a parent category', 400);
      }
    }

    const duplicates = await db.query(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND parent_id IS NOT DISTINCT FROM $2 AND id != $3 LIMIT 1',
      [nextName, nextParentId, categoryId]
    );

    if (duplicates.length) {
      throw new AppError('Category already exists', 409);
    }

    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push(`name = ${addParam(values, nextName)}`, `slug = ${addParam(values, await getUniqueCategorySlug(nextName, categoryId))}`);
    }

    if (parentId !== undefined) {
      fields.push(`parent_id = ${addParam(values, nextParentId)}`);
    }

    if (description !== undefined) {
      fields.push(`description = ${addParam(values, description || null)}`);
    }

    if (image !== undefined) {
      fields.push(`image = ${addParam(values, image || null)}`);
    }

    if (!fields.length) {
      throw new AppError('No fields to update', 400);
    }

    await db.query(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = ${addParam(values, categoryId)}`,
      values
    );

    res.json({ success: true, message: 'Category updated successfully' });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const categoryId = Number(req.params.id);

    if (Number.isNaN(categoryId)) {
      throw new AppError('Valid category is required', 400);
    }

    const categories = await db.query(
      'SELECT id FROM categories WHERE id = $1 LIMIT 1',
      [categoryId]
    );

    if (!categories.length) {
      throw new AppError('Category not found', 404);
    }

    await db.query('DELETE FROM categories WHERE id = $1', [categoryId]);

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const uploadProductImages = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('Image file is required', 400);
    }

    const image = await uploadImageToSupabase(req.file);

    res.status(201).json({
      success: true,
      imageUrl: image.url
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const fields = [];
    const values = [];

    const fieldMap = {
      name: 'name', description: 'description', shortDescription: 'short_description',
      price: 'price', comparePrice: 'compare_price', categoryId: 'category_id',
      brand: 'brand', stockQuantity: 'stock_quantity', sku: 'sku',
      isFeatured: 'is_featured', status: 'status', discountPercent: 'discount_percent',
      taxRate: 'tax_rate', popularityScore: 'popularity_score'
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        fields.push(`${dbField} = ${addParam(values, updates[key])}`);
      }
    }

    if (updates.images) {
      fields.push(`images = ${addParam(values, JSON.stringify(updates.images))}`);
    }

    if (updates.specifications) {
      fields.push(`specifications = ${addParam(values, JSON.stringify(updates.specifications))}`);
    }

    if (updates.tags !== undefined) {
      fields.push(`tags = ${addParam(values, normalizeTags(updates.tags))}`);
    }

    if (fields.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    await db.query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = ${addParam(values, id)}`,
      values
    );

    res.json({ success: true, message: 'Product updated successfully' });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await db.query(
      `SELECT c.*, (SELECT COUNT(*)::int FROM products WHERE category_id = c.id AND is_active = true) as product_count
       FROM categories c WHERE c.is_active = true ORDER BY c.name`
    );

    const parentCategories = categories.filter(c => !c.parent_id);
    const childCategories = categories.filter(c => c.parent_id);

    const result = parentCategories.map(parent => ({
      ...parent,
      subcategories: childCategories.filter(c => c.parent_id === parent.id)
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await db.query(
      `SELECT p.id, p.name, p.slug, p.price, p.compare_price, p.images, ${reviewRatingExpr} as computed_rating, ${reviewCountExpr} as computed_review_count, p.discount_percent
       FROM products p ${reviewStatsJoin}
       WHERE p.is_featured = true AND p.is_active = true AND p.status = 'active'
       ORDER BY RANDOM() LIMIT 8`
    );

    products.forEach(p => {
      applyReviewStats(p);
      p.images = parseJsonArray(p.images);
    });

    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts, getProductBySlug, createProduct, updateProduct, deleteProduct,
  getCategories, getFeaturedProducts, createCategory, updateCategory, deleteCategory,
  uploadProductImages, getSearchSuggestions, getSearchHistory, getTrendingSearches,
  recordSearchClick
};
