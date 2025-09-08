Cartalex - redeployment june 2025
V. Razanajao - 03/06/2025

The cartalex project is a websig that requires several elements to run:
1) a node.js web application
    This is the front-end where all comes together

2) a qgis map server along with a apache server
    The qgis server is queried by the web app through the script /bin/qgis_mapserv.fcgi.exe and delivers data from the geopackage and the postgres db
    ***Note that the app is listening to port 8085*** (see node.js app in src/qgisserver_config.js line 1 to change the setting according to Apache config) 
    
    https://docs.qgis.org/3.40/en/docs/server_manual/index.html
    https://qgis.org/resources/installation-guide/#osgeo4w-installer

3) a qgis geopackage
    This allows to configure many aspects of the QGis server, such as how layers are delivered, named, typed, etc.

4) a postgres database
    Contains the raster files as well as non-geometric tables with data related to the project (archaeological site characterisations, biblio, etc.). This db is query with SQL statements when info on a site is required.
    The postgres server is accessed by the app with by a user 'postgres' with a pw 'postgres'

In the current folder are avaiable:
A) node.js sources (/cealex_websig-nodejs)
    The source of the node.js application, with a dist that is runnable (/dist/main.js). When started, the app is accessible through localhost:3000
B) QGis geopackage (/geopackage)
    A qgis geopackage made of 2 files that must be kept together in the same folder.
    These files should be placed in a folder /projects on the qgis server, so that the script /bin/qgis_mapserv.fcgi.exe can access it through the relative path ../projects
    ***Please note*** that this file will have to be updated once everything is tested because it contains a vector layer that is in the process of being corrected (original cadastre layer has 32 invalid vectors that were preventing the layer to be loaded in the web sig)
C) PostGres db (/postgres)
    A dump of the postgres db, that should be used with a restore on a db named "cartalex_basileia_3857".


This set of files and things are configured to be runned on a local environment. I believe only 2 files have to be amended in the node.js app according to distant server configuration:
- /src/server_config.js
- /src/qgisserver_config.js


