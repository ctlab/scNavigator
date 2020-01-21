# Pull base image.
FROM ubuntu:18.04

RUN set -e \
      && apt-get -y update \
      && apt-get -y install software-properties-common

# Install Nginx.
RUN \
  add-apt-repository -y ppa:nginx/stable && \
  apt-get update && \
  apt-get install -y nginx && \
  rm -rf /var/lib/apt/lists/* && \
  echo "\ndaemon off;" >> /etc/nginx/nginx.conf && \
  chown -R www-data:www-data /var/lib/nginx


RUN set -e \
	&& mkdir -p /sce/sce_js

# Define mountable directories.
VOLUME ["/etc/nginx/sites-enabled", '/sce/sce_js', '/var/datasets']

# Define working directory.
WORKDIR /etc/nginx

# Define default command.
CMD ["nginx"]

# Expose ports.
EXPOSE 80
EXPOSE 443