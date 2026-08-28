from .base import *

SECRET_KEY = env('SECRET_KEY')

DEBUG = False

ALLOWED_HOSTS = env.list('ALLOWED_HOSTS')

# Django сверяет Origin с хостом запроса. Если фронт стоит на своём домене
# (VITE_API_URL во фронте), его нужно перечислить со схемой, иначе все POST
# отвалятся с «Origin checking failed». Один домен на фронт и бэк — оставляем пустым.
CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS', default=[])  # pyright: ignore[reportArgumentType]

DATABASES = {'default': env.db('DATABASE_URL')}

STATIC_ROOT = BASE_DIR / 'staticfiles'

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Всё, что требует HTTPS, снимается одним флагом: прод-сборку проверяют локально
# по http://localhost, а там редирект зациклится и Secure-куки не доедут до браузера.
# В настоящем проде флаг не трогаем.
HTTPS_ONLY = env.bool('HTTPS_ONLY', default=True)

SECURE_SSL_REDIRECT = HTTPS_ONLY
SESSION_COOKIE_SECURE = HTTPS_ONLY
CSRF_COOKIE_SECURE = HTTPS_ONLY
SECURE_HSTS_SECONDS = 31536000 if HTTPS_ONLY else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
