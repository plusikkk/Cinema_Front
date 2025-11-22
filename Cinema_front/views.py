from django.shortcuts import render

def main_page(request):
    return render(request, 'main_page.html')


def movies_now_playing(request):
    context = {
        'page_title': 'Зараз у кіно',
        'status_to_load': 'screened'
    }
    return render(request, 'all_movies.html', context)

def movies_coming_soon(request):
    context = {
        'page_title': 'Скоро у кіно',
        'status_to_load': 'soon'
    }
    return render(request, 'all_movies.html', context)


