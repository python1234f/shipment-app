from django.urls import path
from . import views

urlpatterns = [
    path('allocations/', views.get_set_allocations),
    path('allocations/<int:id>', views.get_allocation),
    path('vehicles/', views.get_vehicles),
    path('employees/', views.get_employees),

    path('init/', views.init),

]