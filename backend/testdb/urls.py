from django.urls import path, include
from . import views

urlpatterns = [
    path('api/', include([
        path('shipments/', views.get_set_shipments),
        path('shipments/<int:id>', views.get_shipment),
        path('vehicles/', views.get_vehicles),
        path('employees/', views.get_employees),
        path('contents/', views.get_contents),
        path('init/', views.init),
    ])),
]
