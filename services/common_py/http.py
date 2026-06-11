from flask import jsonify


def add_cors_headers(response, allowed_headers="content-type,authorization,x-user-id,x-file-name"):
    response.headers["access-control-allow-origin"] = "*"
    response.headers["access-control-allow-methods"] = "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    response.headers["access-control-allow-headers"] = allowed_headers
    return response


def json_response(payload, status=200):
    response = jsonify(payload)
    response.status_code = status
    return add_cors_headers(response)

