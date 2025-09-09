// Middleware functions for query building and selection

import { validationResult } from 'express-validator';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes default TTL

function addWhere(req, res, next) {
    let whereClause = "";
    if (Object.keys(req.query).length) {
        whereClause += ' WHERE';
        for (let param in req.query) {
            if (param.endsWith('floor')) {
                whereClause += ` ${param.split('.')[0]}.${req.query[param].split('|')[0]} >= ${req.query[param].split('|')[1]} AND`;
                continue;
            } else if (param.endsWith('ceil')) {
                whereClause += ` ${param.split('.')[0]}.${req.query[param].split('|')[0]} <= ${req.query[param].split('|')[1]} AND`;
                continue;
            }
            whereClause += ` ${param} IN (`;
            for (let value of req.query[param].split('|')) {
                whereClause += `'${value.replaceAll("'", "''")}',`;
            }
            whereClause = whereClause.slice(0, -1) + ') AND ';
        }
        whereClause = whereClause.slice(0, -4) + ';';
    }
    res.locals.whereClause = whereClause;
    next();
}

function addWhereSf(req, res, next) {
    let whereClause = "";
    if (Object.keys(req.query).length) {
        whereClause += ' WHERE';
        for (let param in req.query) {
            if (param.endsWith('floor')) {
                whereClause += ` ${param.split('.')[0]}.${req.query[param].split('|')[0]} >= ${req.query[param].split('|')[1]} AND`;
                continue;
            } else if (param.endsWith('ceil')) {
                whereClause += ` ${param.split('.')[0]}.${req.query[param].split('|')[0]} <= ${req.query[param].split('|')[1]} AND`;
                continue;
            }
            whereClause += ` sf.${param} IN (`;
            for (let value of req.query[param].split('|')) {
                whereClause += `'${value.replaceAll("'", "''")}',`;
            }
            whereClause = whereClause.slice(0, -1) + ') AND ';
        }
        whereClause = whereClause.slice(0, -4) + ';';
    }
    res.locals.whereClause = whereClause;
    next();
}

function addWhereMainTable(req, res, next) {
    let whereClause = "";
    if (Object.keys(req.query).length) {
        let path = req._parsedUrl.pathname;
        const lastSlash = path.lastIndexOf("/");
        const secondLastSlash = path.lastIndexOf("/", lastSlash - 1);
        let mainTable = path.substring(secondLastSlash + 1, lastSlash);
        whereClause += ' WHERE';
        for (let param in req.query) {
            if (param.endsWith('floor')) {
                whereClause += ` ${mainTable}${param.split('.')[0]}.${req.query[param].split('|')[0]} >= ${req.query[param].split('|')[1]} AND`;
                continue;
            } else if (param.endsWith('ceil')) {
                whereClause += ` ${param.split('.')[0]}.${req.query[param].split('|')[0]} <= ${req.query[param].split('|')[1]} AND`;
                continue;
            }
            whereClause += ` ${mainTable}.${param} IN (`;
            for (let value of req.query[param].split('|')) {
                whereClause += `'${value.replaceAll("'", "''")}',`;
            }
            whereClause = whereClause.slice(0, -1) + ') AND ';
        }
        whereClause = whereClause.slice(0, -4);
    }
    res.locals.whereClause = whereClause;
    next();
}

function addOrderAliasOnSelectDistinct(req, res, next) {
    res.locals.selectQuery = req.query.fromTable ? `SELECT DISTINCT ${req.query.fromTable}.${req.query.field}` : `SELECT DISTINCT ${req.query.field}`;
    res.locals.selectQuery += req.query.alias ? ` AS ${req.query.alias}` : '';
    res.locals.selectQuery += req.query.field != req.query.order && typeof req.query.order !== 'undefined' ? `, ${req.query.fromTable}.${req.query.order}` : '';
    res.locals.orderQuery = req.query.order ? ` ORDER BY ${req.query.fromTable}.${req.query.order}` : ` ORDER BY ${req.query.field}`;
    next();
}

// Input validation middleware (example usage)
function validateRequest(validations) {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    };
}

// Centralized error handling middleware
function errorHandler(err, req, res, next) {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
}

/**
 * Cache middleware for GET requests.
 * Caches based on full URL (path + query).
 */
function cacheMiddleware(req, res, next) {
    if (req.method !== 'GET') return next();
    const key = req.originalUrl;
    const cached = cache.get(key);
    if (cached) {
        return res.json(cached);
    } else {
        res.sendResponse = res.json;
        res.json = (body) => {
            cache.set(key, body);
            res.sendResponse(body);
        };
        next();
    }
}

export { addWhere, addWhereSf, addWhereMainTable, addOrderAliasOnSelectDistinct, validateRequest, errorHandler, cacheMiddleware }; 