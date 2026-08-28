from rest_framework import pagination


class PageNumberPagination(pagination.PageNumberPagination):
    """PAGE_SIZE остаётся общим для API, размер страницы экрана просит клиент"""

    page_size_query_param = 'page_size'
    max_page_size = 100
