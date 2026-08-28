"""Массовая смена статуса и откат: обратные запросы, а не снимок списка."""

from playwright.sync_api import Page, expect

from conftest import Data, rows, select_with_option


def test_bulk_status_change_can_be_undone(signed_in: Page, data: Data) -> None:
    page = signed_in
    worker = data.worker()
    for _ in range(3):
        data.task(worker)

    page.goto('/tasks')
    select_with_option(page, 'Все рабочие').select_option(label=worker['name'])
    checkboxes = page.get_by_label('Выбрать задачу')
    expect(checkboxes).to_have_count(3)

    for i in range(3):
        checkboxes.nth(i).check()
    page.get_by_label('Сменить статус выбранных').select_option('В работе')

    expect(rows(page, 'tasks').get_by_text('В работе', exact=True)).to_have_count(3)

    page.get_by_role('button', name='Вернуть').click()

    expect(rows(page, 'tasks').get_by_text('Новая', exact=True)).to_have_count(3)
