FROM python:3.11

WORKDIR /code

COPY ./ /code/

RUN apt update
RUN apt install libldap2-dev libsasl2-dev -y
RUN pip install pyOpenSSL==24.1.0
RUN pip3 install --no-cache-dir --upgrade -r /code/requirements.txt

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
