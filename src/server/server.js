import path from 'path';
import express from 'express';
import cors from 'cors';
import xml2js from 'xml2js';
import dotenv from 'dotenv';
import db from './db.js';
import router from './routes.js';
import { errorHandler } from './middleware.js';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import compression from 'compression';

dotenv.config();

const dist_dir = __dirname;

const app = express();

app.use(morgan('dev'));

app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

// Restrict CORS to trusted origin
const allowedOrigins = [process.env.CORS_ORIGIN || 'http://localhost:3000'];
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

app.use(express.json())
app.use(express.static(dist_dir))
app.use(compression());

const html_file = path.join(dist_dir, 'index.html')

app.get('/', async(req, res) => {
    res.render(html_file)
});

app.get('/carte', async(req, res) => {
    res.sendFile(path.join(dist_dir, 'map.html'));
});


/**************Refact**************/
function addWhere(req, res, next){
    let whereClause = "";
    
    if (Object.keys(req.query).length){
        whereClause += ' WHERE'
        for (let param in req.query){
    
            if(param.endsWith('floor')){
                whereClause += ` ${param.split('.')[0]}.${req.query[param].split('|')[0]} >= ${req.query[param].split('|')[1]} AND`;
                continue;
            } else if(param.endsWith('ceil')){
                whereClause += ` ${param.split('.')[0]}.${req.query[param].split('|')[0]} <= ${req.query[param].split('|')[1]} AND`;
                continue;
            }

            whereClause += ` ${param} IN (`
            for (let value of req.query[param].split('|')){
                    whereClause += `'${value.replaceAll("'", "''")}',`
            }
            console.log("1st slice ", whereClause)
            whereClause = whereClause.slice(0,-1) + ') AND '
        }
        console.log("2nd slice ", whereClause)
        whereClause = whereClause.slice(0, -4) + ';'
        }
    res.locals.whereClause = whereClause;
    next();
}

function addWhereSf(req, res, next){
    let whereClause = "";
    
    if (Object.keys(req.query).length){
        whereClause += ' WHERE'
        for (let param in req.query){
    
            if(param.endsWith('floor')){
                whereClause += ` ${param.split('.')[0]}.${req.query[param].split('|')[0]} >= ${req.query[param].split('|')[1]} AND`;
                continue;
            } else if(param.endsWith('ceil')){
                whereClause += ` ${param.split('.')[0]}.${req.query[param].split('|')[0]} <= ${req.query[param].split('|')[1]} AND`;
                continue;
            }

            whereClause += ` sf.${param} IN (`
            for (let value of req.query[param].split('|')){
                    whereClause += `'${value.replaceAll("'", "''")}',`
            }
            console.log("1st slice ", whereClause)
            whereClause = whereClause.slice(0,-1) + ') AND '
        }
        console.log("2nd slice ", whereClause)
        whereClause = whereClause.slice(0, -4) + ';'
        }
    res.locals.whereClause = whereClause;
    next();
}

function addWhereMainTable(req, res, next){
    console.log(req)
    let whereClause = "";
    if (Object.keys(req.query).length){
        let path = req._parsedUrl.pathname
        const lastSlash = path.lastIndexOf("/");
        const secondLastSlash = path.lastIndexOf("/", lastSlash - 1);
        
        let mainTable = path.substring(secondLastSlash + 1, lastSlash)
        console.log("Path: " , path)
        console.log("Path: " , path)
        
        // delete params[keys[0]]
        
        console.log("Mainbtable", mainTable)
        
        whereClause += ' WHERE'
        for (let param in req.query){
        
            if(param.endsWith('floor')){
                whereClause += ` ${mainTable}${param.split('.')[0]}.${req.query[param].split('|')[0]} >= ${req.query[param].split('|')[1]} AND`;
                continue;
            } else if(param.endsWith('ceil')){
                whereClause += ` ${param.split('.')[0]}.${req.query[param].split('|')[0]} <= ${req.query[param].split('|')[1]} AND`;
                continue;
            }

            whereClause += ` ${mainTable}.${param} IN (`
            for (let value of req.query[param].split('|')){
                    whereClause += `'${value.replaceAll("'", "''")}',`
            }
            console.log("1st slice ", whereClause)
            whereClause = whereClause.slice(0,-1) + ') AND '
        }
        console.log("2nd slice ", whereClause)
        whereClause = whereClause.slice(0, -4)
        // + ';'
        }
    res.locals.whereClause = whereClause;
    next();
}

function addOrderAliasOnSelectDistinct(req, res, next){
    res.locals.selectQuery = req.query.fromTable ? `SELECT DISTINCT ${req.query.fromTable}.${req.query.field}` : `SELECT DISTINCT ${req.query.field}`;
    res.locals.selectQuery += req.query.alias ? ` AS ${req.query.alias}` : '';
    res.locals.selectQuery += req.query.field != req.query.order && typeof req.query.order !== 'undefined' ? `, ${req.query.fromTable}.${req.query.order}` : '';
    res.locals.orderQuery = req.query.order ? ` ORDER BY ${req.query.fromTable}.${req.query.order}` : ` ORDER BY ${req.query.field}`;
    next();
}

app.get('/getValues/vestiges', addOrderAliasOnSelectDistinct, async(req, res) => {
    var dbquery = res.locals.selectQuery
    + ' FROM vestiges'
    + ' JOIN datations ON vestiges.id = datations.id_vestige'
    + ' JOIN caracterisations ON vestiges.id_caracterisation = caracterisations.id'
    + ' JOIN periodes ON datations.id_periode = periodes.id'
    + res.locals.orderQuery;

    try {
        let values = await db.any(dbquery);
        res.json(values);
    } catch (error) {
        res.send(error);
    }
})

app.get('/getValues/bibliographies', addOrderAliasOnSelectDistinct, async(req, res) => {
    var dbquery = res.locals.selectQuery
    + ' FROM bibliographies'
    + ' JOIN personnes ON bibliographies.id_auteur1 = personnes.id'
    + res.locals.orderQuery;
    
    try {
        let values = await db.any(dbquery);
        res.json(values);
    } catch (error) {
        res.send(error);
    }
})

app.get('/getValues/periodes', addOrderAliasOnSelectDistinct, async(req, res) => {
    var dbquery = res.locals.selectQuery
    + ' FROM periodes'
    + res.locals.orderQuery;

    try {
        let values = await db.any(dbquery);
        res.json(values);
    } catch (error) {
        res.send(error);
    }
})

app.get('/getValues/decouvertes', addOrderAliasOnSelectDistinct, async(req, res) => {
    var dbquery = res.locals.selectQuery
    + ' FROM decouvertes'
    + ' JOIN personnes ON decouvertes.id_inventeur = personnes.id'
    + res.locals.orderQuery;

    try {
        let values = await db.any(dbquery);
        res.json(values);
    } catch (error) {
        res.send(error);
    }
})

app.get('/sitesFouilles/vestiges', addWhereMainTable, async(req, res) => {
    let dbquery = `SELECT * FROM vestiges`
    +' JOIN sites_fouilles ON sites_fouilles.id = vestiges.id_site'
    +' JOIN datations ON datations.id_vestige = vestiges.id'
    +' JOIN periodes as p ON datations.id_periode = p.id'
    +' JOIN caracterisations AS c ON vestiges.id_caracterisation = c.id '
    // + 'WHERE v.id_site = '
    + res.locals.whereClause
    + ' ORDER by c.caracterisation, p.periode ;';

    try {
        let values = await db.any(dbquery);
        res.json(values);
    } catch (error) {
        res.send(error);
    }
})
// app.get('/sitesFouilles/vestiges', addWhere, async(req, res) => {
//     let dbquery = `SELECT DISTINCT sf.id FROM sites_fouilles AS sf`
//     +' JOIN vestiges AS v ON v.id_site = sf.id'
//     +' JOIN datations ON datations.id_vestige = v.id'
//     +' JOIN periodes as p ON datations.id_periode = p.id'
//     +' JOIN caracterisations AS c ON v.id_caracterisation = c.id '
//     + res.locals.whereClause;

//     try {
//         let values = await db.any(dbquery);
//         res.json(values);
//     } catch (error) {
//         res.send(error);
//     }
// })
app.get('/sitesFouilles/decouvertes', addWhere, async(req, res) => {
    let dbquery = 'SELECT DISTINCT sf.id FROM sites_fouilles AS sf'
    + ' JOIN decouvertes AS d ON sf.id = d.id_site'
    + ' JOIN personnes AS p ON d.id_inventeur = p.id '
    + res.locals.whereClause;
    console.log(dbquery);
    try {
        let values = await db.any(dbquery);
        res.json(values);
    } catch (error) {
        res.send(error);
    }
})

app.get('/sitesFouilles/bibliographies', addWhereSf, async(req, res) => {
    let dbquery = 'SELECT * FROM sites_fouilles AS sf'
    + ' JOIN decouvertes AS d ON sf.id = d.id_site'
    + ' JOIN references_biblio AS rb ON rb.id_decouverte = d.id'
    + ' JOIN bibliographies AS b ON b.id = rb.id'
    + ' JOIN personnes AS p ON p.id = b.id_auteur1'

    // let dbquery = 'SELECT DISTINCT sf.id FROM sites_fouilles AS sf'
    // + ' JOIN decouvertes AS d ON sf.id = d.id_site'
    // + ' JOIN references_biblio AS rb ON rb.id_decouverte = d.id'
    // + ' JOIN bibliographies AS b ON b.id = rb.id'
    // + ' JOIN personnes AS p ON p.id = b.id_auteur1'
    + res.locals.whereClause;
    console.log(dbquery);
    
    try {
        let values = await db.any(dbquery);
        console.log(values);
        res.json(values);
    } catch (error) {
        res.send(error);
    }
})

app.get('/getInfos/sitesFouilles', addWhereSf, async(req, res) => {
    let dbquery = 'SELECT *, sf.commentaire as sf_commentaire FROM sites_fouilles AS sf' 
    // +' JOIN vestiges AS v ON v.id_site = sf.fid'
    // +' JOIN datations ON datations.id_vestige = v.id'
    // +' JOIN periodes as p ON datations.id_periode = p.id'
    // +' JOIN caracterisations AS c ON v.id_caracterisation = c.id'
    + ' JOIN decouvertes AS d ON sf.id = d.id_site'
    + ' JOIN personnes AS pers ON d.id_inventeur = pers.id '
        //Biblio
    // + ' JOIN references_biblio AS rb ON rb.id_decouverte = d.id'
    // + ' JOIN bibliographies AS b ON b.id = rb.id'
    // + ' JOIN personnes AS author ON author.id = b.id_auteur1'
    
    //+' JOIN personnes AS p ON p.id_caracterisation = c.id '
    // let dbquery = 'SELECT num_tkaczow, commentaire, x, y, uri_geonames FROM sites_fouilles'
    // let dbquery = 'SELECT * FROM sites_fouilles'
    + res.locals.whereClause;
    try {
        let values = await db.any(dbquery);
        res.json(values);
    } catch (error) {
        res.send(error);
    }
})
/**********************************/

/*
app.get('/sitesFouilles/aroundParcelles', async(req, res) => {
    console.log("id parcelles : ", req.query.id_parcelles)
    let dbquery =  `SELECT DISTINCT sf.id FROM sites_fouilles AS sf, parcelles_region AS pr `
    + `WHERE ST_Intersects(ST_Buffer(sf.geom, ${req.query.radius}), pr.geom) AND pr.id IN (${req.query.id_parcelles})`
    console.log(dbquery)

    let id_fouilles = await db.any(dbquery)
    res.json(id_fouilles)
})
*/

// Swagger setup
const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/', router);

// Centralized error handler (should be last)
app.use(errorHandler);

const port = 3000
app.listen(port, () => {
    console.log(`App listening to ${port}....`)
    console.log('Press Ctrl+C to quit.')
})
