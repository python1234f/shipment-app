import { Button, Alert, AlertIcon, AlertTitle, Slide, Box, SimpleGrid } from "@chakra-ui/react";
import dynamic from "next/dynamic";
import React, { useState, useEffect, useRef } from "react";
import { DragDropContext } from "react-beautiful-dnd";
import { BASE_API_URL } from "../src/config";

const Shipment = dynamic(() => import("../src/Shipment"), { ssr: false });
const ElementList = dynamic(() => import("../src/ElementList"), { ssr: false });

const reorderColumnList = (source, startIndex, endIndex) => {
  const [removed] = source.elements.splice(startIndex, 1);
  source.elements.splice(endIndex, 0, removed);
  return source;
};

export default function Home() {
  const [alertType, setAlertType] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [shipmentAttributes, setShipmentAttributes] = useState(shipmentAttributesData);
  
  const addShipment = () => {
    
    const newShipments = [...shipments]
    const id = newShipments.length ? Math.max(...newShipments.map(e=>e.id)) + 1 : 1;
    const shipment = {
      droppable: true,
      elements: [],
      id,
      name: "",
      type: "shipment",
      date: "null"
    }
    newShipments.push(shipment);
    setShipments(newShipments);

  }

  const saveAll = () => {
    let error = false;
    shipments.forEach(shipment => {
      const name = `shipment-${shipment.id}`
      
      if(shipment.date === "null"){
        alert(`${name} must have a date`)
        error = true;
        return
      }
      for(let type in shipmentAttributes){
        if (!shipment.elements.find(e=>e.type===type)){
          alert(`${type} missing from ${name}`)
          error = true;
          return
        }
      }

    })
    if(error){
      return
    }
    fetch(`${BASE_API_URL}shipments/`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shipments)
    })
    .then(response => {

      response.json().then((data => {
        if(response.ok){
          alert("Saving OK!");
        }else{
          alert("Saving failed :( " + data.error)
        }

      }))
    })
    .catch(e=>{
      alert(e)
    })
  }


  const onDragStart = (result) => {

    const { source } = result; 
    
    let sourceField
    if(source.droppableId.includes('shipment')){
      let id = parseInt(source.droppableId.slice("shipment-".length))
      sourceField = shipments.find(e=>e.id===id);
    } else {
      sourceField = shipmentAttributes[source.droppableId] 
    }

    const dragged = sourceField.elements.find(el=>el.id === parseInt(
      result.draggableId.slice(el.type.length + 1)
    ) );

    const newShipments = [];

    shipments.forEach( (shipment) => {

      newShipments.push(shipment);
      
      // If user tries to add anything to already complete shipment
      if (shipment.complete) {
        shipment.droppable = false;
        return;
      }

      // If shipment already has element of same type assigned, disallow dropping
      for(let type in shipmentAttributes){
        if (dragged.type === type &&
            shipment.elements.find(element => element.type === type)) {
            
              if(shipment.id === sourceField.id){
                // allow dropping to same shipment
                return
              }
              message.current = ` already has ${type} assigned`
              shipment.droppable = false;
              return;
        }
      }

    })

    // allow only dropping back to the same ElementList
    const newShipmentAttributes = {...shipmentAttributes}
    for(let type in shipmentAttributes){
      if(dragged.type !== type){
        newShipmentAttributes[type].droppable = false
      }
    }
    if(newShipmentAttributes !== shipmentAttributes){
      setShipmentAttributes(newShipmentAttributes);
    }

    setShipments(newShipments);

  }

  useEffect(() => {
    const timeId = setTimeout(() => {
      setAlertType(null);
      setAlertMessage(null);
    }, 3000)

    return () => { clearTimeout(timeId) } 

  }, [alertType]);

  const [shipments, setShipments] = useState([]);

  useEffect(() => {
    console.log(`${BASE_API_URL}shipments`)
    fetch(`${BASE_API_URL}shipments`)
    .then(response => {
      response.json().then((data => {
        let shipments = []
        data.forEach(shipment => {
          shipment.elements = []
          Object.values(shipmentAttributes).map(e=>e.type).forEach(el=>{
            shipment[el].type = el
            shipment.elements.push(shipment[el])
            delete shipment[el]
          })
          shipments.push({...shipment, type: "shipment", droppable: true})
        })

        setShipments(shipments);
      }))
    })
  },[])


  const handlePostDrop = (withinSame=false) => {

    // If user tried to drop on undroppable
    console.log('lastDroppedOn',lastDroppedOn)
    console.log('shipments',shipments)
    const shipment = shipments.find(e=>e.id===lastDroppedOn);
    if ( shipment && (!shipment.droppable) ) {
      if (!withinSame) {
        setAlertType("warning")
        let msg = [...`shipment ${shipment.id} ${message.current}`].join("")
        setAlertMessage(msg)
      }
    }

    // Re-enable drop on shipments
    const newShipments = [...shipments]
    newShipments.forEach(shipment=>{
      shipment.droppable = true;
    })
    const newShipmentAttributes = {...shipmentAttributes}
    for(let key in newShipmentAttributes){
      newShipmentAttributes[key].droppable = true;
    }

    // Apply changes
    setShipmentAttributes(newShipmentAttributes);
    setShipments(newShipments)

  }

  let lastDroppedOn = null;
  let message = useRef(null);

  const onDragEnd = (result) => {
    const { destination, source } = result;

    console.log("ds", destination, source)

    // If user tries to drop in an unknown destination
    if (!destination) {
      handlePostDrop(source.droppableId === lastDroppedOn);
      return
    };

    // If the user drags and drops back in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      handlePostDrop();
      return;
    }

    // If user tries to move between Attributes (e.g. move Vehicle to Employees list)
    if( [...new Set([destination.droppableId, source.droppableId])].filter(e=>!e.includes("shipment")).length > 1){
      setAlertType("warning")
      setAlertMessage(`Cannot move between ${destination.droppableId} and ${source.droppableId}`)   
    }

    let sourceField;
    if(source.droppableId.includes('shipment')){
      let id = parseInt(source.droppableId.slice("shipment-".length))
      sourceField = shipments.find(e=>e.id===id);
    } else {
      sourceField = shipmentAttributes[source.droppableId] 
    }

    let destinationField;
    if(destination.droppableId.includes('shipment')){
      let id = parseInt(destination.droppableId.slice("shipment-".length))
      destinationField = shipments.find(e=>e.id===id);
    } else {
      destinationField = shipmentAttributes[destination.droppableId] 
    }


    // If the user drops within the same field, reorder field elements
    if (sourceField.id === destinationField.id && sourceField.type === destinationField.type) {
      const newField = reorderColumnList(
        sourceField,
        source.index,
        destination.index
      );

      if(newField.type !== "shipment") {
        // use saved useState setter to set elements
        newField.setElements(newField.elements)
      } else {
        const newShipments = [...shipments]
        newShipments.find(e=>e.id===newField.id).elements = newField.elements;
        newShipments.forEach(shipment=>shipment.droppable=true)

        const newShipmentAttributes = {...shipmentAttributes}
        for(let key in newShipmentAttributes){
          newShipmentAttributes[key].droppable = true;
        }

        // Apply changes
        setShipmentAttributes(newShipmentAttributes);
        setShipments(newShipments);
      }
    
      lastDroppedOn = null;
  
      handlePostDrop();
      return;
    }

    // If the user moves from one anything to another anything
    // const startElements = Array.from(sourceField.elements.map(el=>`${el.type}-${el.id}`));
    let [removed] = sourceField.elements.splice(source.index, 1);
    sourceField.droppable = true;

    destinationField.elements.splice(destination.index, 0, removed);

    shipments.forEach((shipment) => {
      shipment.droppable = true;
    })

    const boxes = [destinationField, sourceField];
    
    boxes.forEach(box=>{
      if(box.type !== "shipment") {
        // use saved useState setter to set elements
        box.setElements(box.elements)
      } else {
        shipments.find(e=>e.id===box.id).elements = box.elements;
      }
    })

    lastDroppedOn = null;

    const newShipmentAttributes = {...shipmentAttributes}
    for(let key in newShipmentAttributes){
      newShipmentAttributes[key].droppable = true;
    }
    const newShipments = [...shipments]
    newShipments.forEach(shipment=>shipment.droppable=true)
    setShipments(newShipments);

  };

  const mouseUp = (event) => {

    let shipmentId = event.target.attributes.getNamedItem('data-rbd-droppable-id')
    if (!shipmentId) {
      return
    }
    shipmentId = shipmentId.value;
    lastDroppedOn = parseInt(shipmentId.slice("shipment-".length));

    console.log('mouseUp', shipmentId)
  
  }
  
  return (
    <>

      <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>

      <Box bg="main-bg" h="calc(100vh)">

        {// Render boxes for all Attributes - right now it's vehicles and cars
        Object.keys(shipmentAttributes).map((key) => {
          let shipmentAttr = shipmentAttributes[key];
          const [elements, setElements] = useState([]);
          shipmentAttr.elements = elements;
          shipmentAttr.setElements = setElements;

          const url = shipmentAttr.url;

          const elementList = <ElementList 
                                droppable={shipmentAttr.droppable}
                                key={`${shipmentAttr.type}-${shipmentAttr.id}`} 
                                type={shipmentAttr.type} url={url} 
                                elements={elements} 
                                setElements={setElements}>
                              </ElementList>
          
          return (
            <Box bg="main-bg" w='calc(100vw)' style={{border: "1px solid red"}}>
              {elementList}
            </Box>
          ) 

        })}

        <Box bg="main-bg" w='calc(100vw)'></Box>
          <Button colorScheme='green' onClick={addShipment}>Add Shipment</Button>
          <Button colorScheme='green' onClick={saveAll}>Save All</Button>
          <SimpleGrid p={20} spacing={10} minChildWidth={250} color="white-text" bg="main-bg">

              {shipments.map((shipment) => {
                return (
                  <Box>
                    <span onMouseUp={mouseUp}>
                    <Shipment
                      key={shipment.id} 
                      shipment={shipment} 
                      setShipments={setShipments}
                      shipments={shipments}
                    />
                    </span>
                  </Box>
                )

              })}

          </SimpleGrid>

      </Box>
      </DragDropContext>
      <Slide direction='bottom' in={alertType !== null} style={{ zIndex: 10 }}>
          <Alert status={'warning'}>
            <AlertIcon />
            <AlertTitle>{alertMessage}</AlertTitle>
          </Alert>
        </Slide>
    </>
  );
}

const shipmentAttributesData = {
  vehicle: {url :"vehicles", elements: null, setElements: null, type: 'vehicle', droppable: true},
  employee: {url :"employees", elements: null, setElements: null, type: 'employee', droppable: true},
  content: {url :"contents", elements: null, setElements: null, type: 'content', droppable: true},
};
