FROM python:3.10-slim-bullseye

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get -y install psmisc vim curl poppler-utils && \
    pip install --upgrade pip

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_APP=main.py \
    LC_ALL=C.UTF-8 \
    LANG=C.UTF-8

WORKDIR /root/AIJSV

COPY requirements.txt /root/AIJSV/

RUN /bin/bash -c "pip install -r requirements.txt"

ADD . /root/AIJSV

CMD gunicorn -b :8000  main:app -k eventlet -t 100 -w 1 --timeout 3600 \
        --access-logfile - --access-logformat '%({x-forwarded-for}i)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'
