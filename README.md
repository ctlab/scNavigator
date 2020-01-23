# scNavigator

[![Build Status](https://travis-ci.org/ctlab/scNavigator.svg?branch=master)](https://travis-ci.org/ctlab/scNavigator)

scNavigator is a docker-compose application: server-side contains of multiple containers like webserver written in Kotlin and file system manager written in Python

## Navigator: server-side

Server side is built using `./gradlew build` (to get jars) and `docker-compose`. 

We have several main services:
* Nginx
* MongoDB
* Kotlin-based backend server
* Python-based h5-converter and file system manager

To build the application first run:

`./gradlew build`

This will run kotlin-based applications tests and builds.

Then run:

`docker-compose build` (with `sudo` if required)

this will build the whole multi-container application and also run python tests.

## Navigator: client-side
Frontend for Navigator is build with React + Redux which allows full control over the application state at any point. Frontend is build locally outside of docker-compose container. Building frontend outside of docker-compose container allows us fix client-side bugs and improve client-side behaviour without stopping/restarting docker-compose application.

You can build client side using npm utils:

```
cd ./scn_js
npm install
npm run build
```

## Datasets
If you want your datasets to show up in Navigator, you have to prepare them in a `h5ad` format with some extra fields to `uns`.

Prepare your datasets locally in one folder and make sure to change `DATASET_PATH` in `.env` to this folder you chose. Also make sure that `TMP_PATH` from `.env` exists: there Navigator will store datasets in internal format.

## Running Navigator locally

To run Navigator locally you will first need to build Navigator server-side. Then build client-side js code and then just start docker-compose. Be careful, docker-compose might require sudo privileges.

```
## building server-side
./gradlew build
docker-compose build

## building client-side
cd ./scn_js
npm install
npm run build
cd ..

## running multi-container

docker-compose up

## running multi-container detached

docker-compose up -d
```