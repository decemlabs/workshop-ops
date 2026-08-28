"""Вход через форму: проверяет цепочку Caddy → Django → csrftoken → сессия целиком."""

from playwright.sync_api import Page, expect


def test_anonymous_sees_login_form(page: Page) -> None:
    page.goto('/workshops')

    expect(page.get_by_text('Вход в систему')).to_be_visible()


def test_login_opens_the_app(page: Page, credentials: tuple[str, str]) -> None:
    username, password = credentials

    page.goto('/workshops')
    page.get_by_label('ЛОГИН').fill(username)
    page.get_by_label('ПАРОЛЬ').fill(password)
    page.get_by_role('button', name='Войти').click()

    expect(page.get_by_text('Вход в систему')).to_have_count(0)
    expect(page.get_by_role('button', name='+ Добавить цех')).to_be_visible()


def test_wrong_password_keeps_the_form(page: Page, credentials: tuple[str, str]) -> None:
    username, _ = credentials

    page.goto('/workshops')
    page.get_by_label('ЛОГИН').fill(username)
    page.get_by_label('ПАРОЛЬ').fill('не тот пароль')
    page.get_by_role('button', name='Войти').click()

    expect(page.get_by_role('alert')).to_be_visible()
    expect(page.get_by_text('Вход в систему')).to_be_visible()
