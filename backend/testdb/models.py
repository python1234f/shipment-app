from django.db import models
from rest_framework import serializers


class Employee(models.Model):
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=80)


class Vehicle(models.Model):
    make = models.CharField(max_length=50)
    model = models.CharField(max_length=80)
    registration_plate = models.CharField(max_length=80)


class Allocation(models.Model):
    employee = models.OneToOneField(
        Employee,
        on_delete=models.CASCADE,
        primary_key=False,
    )
    vehicle = models.OneToOneField(
        Vehicle,
        on_delete=models.CASCADE,
        primary_key=False,
    )
    date = models.CharField(max_length=10, null=False, unique=True)
    name = models.CharField(max_length=50)


class EmployeeSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    first_name = serializers.CharField(max_length=50)
    last_name = serializers.CharField(max_length=80)
    allocation = serializers.PrimaryKeyRelatedField(many=False, read_only=True)


class VehicleSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    make = serializers.CharField(max_length=50)
    model = serializers.CharField(max_length=80)
    registration_plate = serializers.CharField(max_length=80)
    allocation = serializers.PrimaryKeyRelatedField(many=False, read_only=True)


class AllocationSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    employee = EmployeeSerializer()
    vehicle = VehicleSerializer()
    name = serializers.CharField(max_length=50)
    date = serializers.CharField(max_length=10)



