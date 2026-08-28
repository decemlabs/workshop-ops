"""Создание цеха через модалку — от кнопки до строки в базе."""

from uuid import uuid4

from playwright.sync_api import Page, expect

from conftest import Data, field


def test_creates_workshop_from_modal(signed_in: Page, data: Data) -> None:
    page = signed_in
    name = f'Цех {uuid4().hex[:6]}'

    page.get_by_role('button', name='+ Добавить цех').click()
    field(page, 'НАЗВАНИЕ').fill(name)
    field(page, 'НОМЕР ЦЕХА').fill(str(data.free_number()))
    page.get_by_role('button', name='Сохранить').click()

    expect(page.get_by_text(name)).to_be_visible()

    # Перезагрузка отделяет «сохранилось» от «показалось»: после неё данные только из API.
    page.reload()
    expect(page.get_by_text(name)).to_be_visible()

    data.adopt('workshops', name)


def test_workshop_without_name_is_rejected(signed_in: Page) -> None:
    page = signed_in

    page.get_by_role('button', name='+ Добавить цех').click()
    page.get_by_role('button', name='Сохранить').click()

    # Модалка остаётся открытой с ошибкой — форму не закрывают, пока не поправят.
    expect(page.get_by_text('Введите название цеха')).to_be_visible()
    expect(page.get_by_role('button', name='Сохранить')).to_be_visible()
