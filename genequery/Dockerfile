FROM gradle:jdk12

USER root
RUN mkdir /genequery
RUN mkdir /downloads
RUN mkdir /genequery/data-files

RUN apt update && apt install -y git

#Install everything for the back-end

ARG COMMITSHA=028350c8049afeb4ccfd0b1d3e8d0549bc27ba10
RUN cd /genequery && git clone https://github.com/konsolerr/genequery-kotlin.git
RUN cd /genequery/genequery-kotlin && git checkout ${COMMITSHA}
RUN cd /genequery/genequery-kotlin && gradle build

RUN cp /genequery/genequery-kotlin/genequery-rest/build/libs/genequery-rest-1.1-SNAPSHOT.jar /genequery/
RUN mv /genequery/genequery-rest-1.1-SNAPSHOT.jar /genequery/gq-rest.jar

# Configs

RUN echo "gq.rest.data.path=/genequery/data-files\n\
gq.rest.network.clustering.on=true\n\
gq.rest.adjPvalueMin=0.01\n\
\n\
logging.file=/genequery/genequery-rest2.log\n\
logging.level.root = INFO\n\
\n\
server.port=\${port:8423}" >  /genequery/application.properties

RUN touch /genequery/genequery-rest2.log

EXPOSE 8423

ENTRYPOINT echo "will wait for other services to load: will sleep for 2 minutes" &&  sleep 120 && while [ $(( $(date +%s) - $(stat -c %Y /genequery/data-files/annotation.json) )) -lt 60 ]; do sleep 10; done; echo "DONE WAITING" && cd /genequery && java -Xmx4096M -Dspring.config.location=./application.properties -jar ./gq-rest.jar & tail -f /genequery/genequery-rest2.log
