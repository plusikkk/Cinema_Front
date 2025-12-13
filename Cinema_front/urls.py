from django.contrib import admin
from django.urls import path
from . import views
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.main_page, name='main_page'),
    path('movies/now-playing/', views.movies_now_playing, name='movies_now_playing'),
    path('movies/coming-soon/', views.movies_coming_soon, name='movies_coming_soon'),
    path('movie/<int:pk>/', views.movie_details, name='movie_details'),
    path('cinemas/', views.cinemas, name='cinemas'),
    path('cinema/<int:pk>/', views.cinema_details, name='cinema_details'),
    path('login/', views.login, name='login'),
    path('register/', views.register, name='register'),
    path('activation/<uidb64>/<token>/', views.activation, name='activation_account' ),
    path('verify/', views.activation, name='activation' ),
    path('profile/', views.profile, name='profile'),
    path('about-us/', views.about_us, name='about_us'),
    path('session/<int:session_id>/seats/', views.seats, name='seats'),
]  + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)


