from .base import *

SECRET_KEY = env.str(
    'SECRET_KEY',
    default='django-insecure-local-only-v4t4ct=%jin)k-c^#9%6eu8j%+d87lg)v)3k',
)

DEBUG = True

ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

DATABASES = {'default': env.db('DATABASE_URL')}

MAILERS = {
    'default': {
        'BACKEND': 'django.core.mail.backends.console.EmailBackend',
    },
}

REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    'DEFAULT_RENDERER_CLASSES': [
        *REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'],
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
}
