from rest_framework.decorators import api_view
from testdb.models import Shipment, Vehicle, Employee, Contents, ShipmentSerializer, VehicleSerializer, EmployeeSerializer, ContentsSerializer
from rest_framework.renderers import JSONRenderer
from django.http import HttpResponse

from json import dumps


@api_view(['GET', 'DELETE'])
def get_shipment(request, id):

    if request.method == 'GET':
        shipment = Shipment.objects.get(id=id)
        shipment = ShipmentSerializer(shipment)

        json = JSONRenderer().render(shipment.data)

    elif request.method == 'DELETE':
        shipment = Shipment.objects.get(id=id)
        shipment.delete()
        json = dumps({"status": "OK"})

    return HttpResponse(json, content_type='application/json')



@api_view(['GET', 'POST'])
def get_set_shipments(request):
    if request.method == 'GET':
        shipments = Shipment.objects.order_by('pk').all()
        shipments = ShipmentSerializer(shipments, many=True)

    elif request.method == 'POST':
        try:
            for shipment in request.data:

                id = shipment['id']
                employee = [i for i in shipment['elements'] if i['type'] == 'employee'][0]
                vehicle = [i for i in shipment['elements'] if i['type'] == 'vehicle'][0]
                content = [i for i in shipment['elements'] if i['type'] == 'content'][0]
                employee = Employee.objects.get(pk=employee['id'])
                existing_vehicle = Vehicle.objects.get(pk=vehicle['id'])
                existing_content = Contents.objects.get(pk=content['id'])

                try:
                    existing_shipment = Shipment.objects.get(pk=id)
                    save = False
                    # change attributes if needed
                    if existing_shipment.employee_id != employee.id:
                        existing_shipment.employee = employee
                        existing_shipment.employee_id = employee.id
                        save = True
                    if existing_shipment.vehicle_id != existing_vehicle.id:
                        existing_shipment.vehicle = existing_vehicle
                        existing_shipment.vehicle_id = existing_vehicle.id
                        save = True
                    if existing_shipment.content_id != existing_content.id:
                        existing_shipment.content = existing_content
                        existing_shipment.content_id = existing_content.id
                        save = True
                    if existing_shipment.date != shipment['date']:
                        existing_shipment.date = shipment['date']
                        save = True

                    if save:
                        try:
                            existing_shipment.save()
                        except Exception as e:
                            return HttpResponse(dumps({'error': f"Shipment-{existing_shipment.id}: " + str(e)}).encode(), status=500, content_type='application/json')

                except Shipment.DoesNotExist:
                    existing_shipment = Shipment(
                        id=shipment['id'],
                        employee=employee,
                        vehicle=existing_vehicle,
                        content=existing_content,
                        date=shipment['date'])
                    existing_shipment.save()

            shipments = Shipment.objects.all()
            shipments = ShipmentSerializer(shipments, many=True)

        except Exception as e:
            return HttpResponse(dumps({'error': str(e)}), content_type='application/json', status=500)

    json = JSONRenderer().render(shipments.data)
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
def get_contents(request):

    contents = Contents.objects.all()
    contents = ContentsSerializer(contents, many=True)

    json = JSONRenderer().render(contents.data)
    return HttpResponse(json, content_type='application/json')


@api_view(['GET'])
def init(request):

    # only init data if no data already
    existing_shipments = Shipment.objects.all()
    if len(existing_shipments) > 0:
        return HttpResponse(b"OK", content_type='application/json')

    # create 2 Shipments:
    for i in range(2):
        employee = Employee(first_name='Marek', last_name='Kopytko')
        vehicle = Vehicle(make='Iveco', model='Daily', registration_plate='XYZ123')
        contents = Contents(content="corn", weight=1000)

        employee.save()
        vehicle.save()
        contents.save()

        shipment = Shipment(employee=employee, vehicle=vehicle, content=contents, date=f"2022-05-2{i}")
        shipment.save()

    # additionally create 10 vehicles and 10 employees
    products = ['corn', 'wheat', 'water', 'oil', 'bricks', 'sand', 'horsers', 'pigs', 'gold', 'silver']
    for i in range(10):
        Employee(first_name='1Marek', last_name='12Kopytko').save()
        Vehicle(make='1Iveco', model='1Daily', registration_plate='1XYZ123').save()
        Contents(content=products[i], weight=i * 100).save()

    return HttpResponse(b"OK", content_type='application/json')
