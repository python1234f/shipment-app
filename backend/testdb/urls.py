from django.urls import path, include
from . import views

urlpatterns = [
    path('api/', include([
        path('allocations/', views.get_set_allocations),
        path('allocations/<int:id>', views.get_allocation),
        path('vehicles/', views.get_vehicles),
        path('employees/', views.get_employees),
        path('init/', views.init),
    ])),
]
