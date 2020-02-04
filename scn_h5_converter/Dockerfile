FROM python:3.8

CMD mkdir -p /scn/scn_h5_converter
WORKDIR /scn/scn_h5_converter

RUN apt-get update && apt-get --assume-yes install jq

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

ENV PYTHONPATH "$PYTHONPATH:/scn/scn_h5_converter"

COPY . .

RUN ["pytest", "tests",  "--typeguard-packages=converter"]

