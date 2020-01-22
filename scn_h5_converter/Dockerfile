FROM python:3.8

CMD mkdir -p /scn/scn_h5_converter
WORKDIR /scn/scn_h5_converter

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

ENV PYTHONPATH "$PYTHONPATH:/scn/scn_h5_converter"

COPY . .

CMD pytest tests --typeguard-packages=converter

