import pytest
from rest_framework.test import APIClient

from .models import User


@pytest.fixture
def master(db):
    return User.objects.create_user(
        'master',
        password='1234',
        first_name='Андрей',
        last_name='Кузнецов',
    )


@pytest.fixture
def client():
    return APIClient(enforce_csrf_checks=True)


def test_me_sets_csrf_cookie_for_anonymous(client):
    """Без этой куки фронт не сможет отправить сам логин"""
    response = client.get('/api/auth/me/')

    assert response.status_code == 403
    assert 'csrftoken' in response.cookies


def test_login_succeeds_and_returns_identity(client, master):
    client.get('/api/auth/me/')  # забираем csrftoken
    token = client.cookies['csrftoken'].value

    response = client.post(
        '/api/auth/login/',
        {'username': 'master', 'password': '1234'},
        HTTP_X_CSRFTOKEN=token,
    )

    assert response.status_code == 200
    assert response.json()['name'] == 'Андрей Кузнецов'


def test_login_rejects_wrong_password(client, master):
    client.get('/api/auth/me/')
    token = client.cookies['csrftoken'].value

    response = client.post(
        '/api/auth/login/',
        {'username': 'master', 'password': 'нет'},
        HTTP_X_CSRFTOKEN=token,
    )

    assert response.status_code == 400
    assert response.json()['detail'] == 'Неверный логин или пароль'


def test_login_rejects_deactivated_user_the_same_way(client, master):
    master.is_active = False
    master.save()
    client.get('/api/auth/me/')
    token = client.cookies['csrftoken'].value

    response = client.post(
        '/api/auth/login/',
        {'username': 'master', 'password': '1234'},
        HTTP_X_CSRFTOKEN=token,
    )

    assert response.status_code == 400
    assert response.json()['detail'] == 'Неверный логин или пароль'


def test_login_requires_csrf_token(client, master):
    client.get('/api/auth/me/')

    response = client.post('/api/auth/login/', {'username': 'master', 'password': '1234'})

    assert response.status_code == 403


def test_session_opens_the_api_and_logout_closes_it(client, master):
    client.get('/api/auth/me/')
    client.post(
        '/api/auth/login/',
        {'username': 'master', 'password': '1234'},
        HTTP_X_CSRFTOKEN=client.cookies['csrftoken'].value,
    )

    assert client.get('/api/workshops/').status_code == 200
    assert client.get('/api/auth/me/').json()['username'] == 'master'

    # login() ротирует csrftoken
    logout = client.post('/api/auth/logout/', HTTP_X_CSRFTOKEN=client.cookies['csrftoken'].value)

    assert logout.status_code == 204
    assert client.get('/api/workshops/').status_code == 403


def test_name_falls_back_to_username(client, db):
    User.objects.create_user('slesar', password='1234')
    client.get('/api/auth/me/')
    response = client.post(
        '/api/auth/login/',
        {'username': 'slesar', 'password': '1234'},
        HTTP_X_CSRFTOKEN=client.cookies['csrftoken'].value,
    )

    assert response.json()['name'] == 'slesar'
