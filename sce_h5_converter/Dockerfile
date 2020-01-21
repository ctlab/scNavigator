FROM python:3.8

CMD mkdir -p /sce/sce_h5_converter
WORKDIR /sce/sce_h5_converter

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

ENV PYTHONPATH "$PYTHONPATH:/sce/sce_h5_converter"

COPY . .

CMD pytest tests --typeguard-packages=converter

