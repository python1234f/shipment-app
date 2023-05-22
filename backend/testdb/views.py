from rest_framework.response import Response
from rest_framework.decorators import api_view
from testdb.models import Allocation, Vehicle, Employee, AllocationSerializer, VehicleSerializer, EmployeeSerializer
from django.core import serializers
from rest_framework.renderers import JSONRenderer, BaseRenderer
from django.http import JsonResponse, HttpResponse
from django.forms.models import model_to_dict
from json import dumps


@api_view(['GET'])
def get_allocation(request, id):

    if request.method == 'GET':
        allocation = Allocation.objects.get(id=id)
        allocation = AllocationSerializer(allocation)

    json = JSONRenderer().render(allocation.data)
    return HttpResponse(json, content_type='application/json')


@api_view(['GET', 'POST'])
def get_set_allocations(request):
    if request.method == 'GET':
        allocations = Allocation.objects.order_by('pk').all()
        allocations = AllocationSerializer(allocations, many=True)

    elif request.method == 'POST':
        for allocation in request.data:

            id = allocation['id']
            employee = [i for i in allocation['elements'] if i['type'] == 'employee'][0]
            vehicle = [i for i in allocation['elements'] if i['type'] == 'vehicle'][0]
            employee = Employee.objects.get(pk=employee['id'])
            existing_vehicle = Vehicle.objects.get(pk=vehicle['id'])

            try:
                existing_allocation = Allocation.objects.get(pk=id)
                save = False
                # change attributes if needed
                if existing_allocation.employee_id != employee.id:
                    existing_allocation.employee = employee
                    existing_allocation.employee_id = employee.id
                    save = True
                if existing_allocation.vehicle_id != existing_vehicle.id:
                    existing_allocation.vehicle = existing_vehicle
                    existing_allocation.vehicle_id = existing_vehicle.id
                    save = True
                if existing_allocation.date != allocation['date']:
                    existing_allocation.date = allocation['date']
                    save = True

                if save:
                    try:
                        existing_allocation.save()
                    except Exception as e:
                        return HttpResponse(dumps({'error': f"allocation-{existing_allocation.id}: " + str(e)}).encode(), status=500, content_type='application/json')

            except Allocation.DoesNotExist:

                existing_allocation = Allocation(employee=employee,
                                                 vehicle=existing_vehicle,
                                                 date=allocation['date'])
                existing_allocation.save()

        allocations = Allocation.objects.all()
        allocations = AllocationSerializer(allocations, many=True)

    json = JSONRenderer().render(allocations.data)
    return HttpResponse(json, content_type='application/json')


@api_view(['GET'])
def get_vehicles(request):

    vehicles = Vehicle.objects.all()
    vehicles = VehicleSerializer(vehicles, many=True)

    json = JSONRenderer().render(vehicles.data)
    return HttpResponse(json, content_type='application/json')

@api_view(['GET'])
def get_employees(request):

    employees = Employee.objects.all()
    employees = EmployeeSerializer(employees, many=True)

    json = JSONRenderer().render(employees.data)
    return HttpResponse(json, content_type='application/json')

@api_view(['GET'])
def init(request):

    Employee(first_name='1Marek', last_name='12Kopytko').save()
    Employee(first_name='1Marek', last_name='12Kopytko').save()
    Employee(first_name='1Marek', last_name='12Kopytko').save()
    Vehicle(make='1Iveco', model='1Daily', registration_plate='1XYZ123').save()
    employee = Employee(first_name='Marek', last_name='Kopytko')
    vehicle = Vehicle(make='Iveco', model='Daily', registration_plate='XYZ123')
    employee.save()
    vehicle.save()

    allocation = Allocation(employee=employee, vehicle=vehicle, date="2022-05-22")
    allocation.save()

    employee = Employee(first_name='Max', last_name='Kolonko')
    vehicle = Vehicle(make='Iveco', model='Daily', registration_plate='23')
    employee.save()
    vehicle.save()

    allocation = Allocation(employee=employee, vehicle=vehicle, date="2022-05-21")
    allocation.save()

    return HttpResponse(b"OK", content_type='application/json')
