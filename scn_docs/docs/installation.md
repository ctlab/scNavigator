---
id: installation
title: Installing scNavigator locally
---

This is an installation guide for scNavigator. 

Main repository will always be hosted at https://github.com/ctlab/scNavigator.

## scNavigator: server-side

Server side is built using `./gradlew build` (to get jars) and `docker-compose`.

We have several main services:
* Nginx
* Mongo Database
* Kotlin-based backend server
* Kotlin-based file system service
* Kotlin-based gene signature search service

To build the application first run:

`./gradlew build`

This will run kotlin-based applications tests and builds.

Then run:

`docker-compose build` (with `sudo` if required)

this will build the whole multi-container application.


## scNavigator: client-side

Frontend for SCE is build with React + Redux which allows full control over the application state at any point. 
Frontend is build locally outside docker-compose container. 
Building frontend outside docker-compose container allows us fix client-side bugs and improve client-side behaviour 
without stopping/restarting docker-compose application.

You can build client side using `npm` utils:

```bash
cd ./sce_js
npm install
npm run build
```

## Datasets
If you want your datasets to show up in Navigator, you have to prepare them in a file format described in the documentation.

Prepare your datasets locally in one folder and make sure to change `DATASET_PATH` in `.env` to this folder you chose. 

## Running Navigator locally

To run Navigator locally you will first need to build Navigator server-side. Then build client-side js code and then just start docker-compose. Be careful, docker-compose might require sudo privileges.

```shell
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