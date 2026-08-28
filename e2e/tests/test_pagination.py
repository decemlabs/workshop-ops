"""Пагинация: страница и её размер должны доезжать до API, а не резаться на клиенте."""

from playwright.sync_api import Page, expect

from conftest import Data, select_with_option


def test_second_page_shows_the_rest(signed_in: Page, data: Data) -> None:
    page = signed_in
    worker = data.worker()
    for i in range(13):  # на страницу помещается 12
        data.task(worker, title=f'Задача {i:02d} {worker["name"]}')

    page.goto('/tasks')
    select_with_option(page, 'Все рабочие').select_option(label=worker['name'])

    expect(page.get_by_text('1–12 из 13')).to_be_visible()
    expect(page.get_by_label('Выбрать задачу')).to_have_count(12)

    page.get_by_role('button', name='Вперёд →').click()

    expect(page.get_by_text('13–13 из 13')).to_be_visible()
    expect(page.get_by_label('Выбрать задачу')).to_have_count(1)
