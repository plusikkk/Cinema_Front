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

def cinemas(request):
    return render(request, 'cinemas.html')

def movie_details(request, pk):
    return render(request, 'film_details.html')

def login(request):
    return render(request, 'login.html')

def register(request):
    return render(request, 'register.html')

def activation(request):
    return render(request, 'activation.html')

def about_us(request):
    return render(request, 'about_us.html')

def cinema_details(request, pk):
    return render(request, 'cinema_details.html')

def profile(request):
    return render(request, 'profile.html')

def seats(request, session_id):
    return render(request, 'seatsMap.html', {'session_id': session_id})

def faq(request):
    return render(request, 'faq.html')


