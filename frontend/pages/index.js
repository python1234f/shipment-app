import { Button, Alert, AlertIcon, AlertTitle, Slide, Box, SimpleGrid } from "@chakra-ui/react";
import dynamic from "next/dynamic";
import React, { useState, useEffect, useRef } from "react";
import { DragDropContext } from "react-beautiful-dnd";
import { BASE_API_URL } from "../src/config";

const Allocation = dynamic(() => import("../src/Allocation"), { ssr: false });
const ElementList = dynamic(() => import("../src/ElementList"), { ssr: false });

const reorderColumnList = (source, startIndex, endIndex) => {
  const [removed] = source.elements.splice(startIndex, 1);
  source.elements.splice(endIndex, 0, removed);
  return source;
};

export default function Home() {
  const [alertType, setAlertType] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [allocationAttributes, setAllocationAttributes] = useState(allocationAttributesData);
  
  const addAllocation = () => {
    
    const newAllocations = [...allocations]
    const id = Math.max(...newAllocations.map(e=>e.id)) + 1
    const allocation = {
      droppable: true,
      elements: [],
      id,
      name: "",
      type: "allocation",
      date: "null"
    }
    debugger;
    newAllocations.push(allocation);
    setAllocations(newAllocations);

  }

  const saveAll = () => {
    let error = false;
    allocations.forEach(allocation => {
      const name = `allocation-${allocation.id}`
      
      if(allocation.date === "null"){
        alert(`${name} must have a date`)
        error = true;
        return
      }
      for(let type in allocationAttributes){
        if (!allocation.elements.find(e=>e.type===type)){
          alert(`${type} missing from ${name}`)
          error = true;
          return
        }
      }

    })
    if(error){
      return
    }
    fetch(`${BASE_API_URL}allocations/`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(allocations)
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
    if(source.droppableId.includes('allocation')){
      let id = parseInt(source.droppableId.slice("allocation-".length))
      sourceField = allocations.find(e=>e.id===id);
    } else {
      sourceField = allocationAttributes[source.droppableId] 
    }

    const dragged = sourceField.elements.find(el=>el.id === parseInt(
      result.draggableId.slice(el.type.length + 1)
    ) );

    const newAllocations = [];

    allocations.forEach( (allocation) => {

      newAllocations.push(allocation);
      
      // If user tries to add anything to already complete allocation
      if (allocation.complete) {
        allocation.droppable = false;
        return;
      }

      // If allocation already has element of same type assigned, disallow dropping
      for(let type in allocationAttributes){
        if (dragged.type === type &&
            allocation.elements.find(element => element.type === type)) {
            
              if(allocation.id === sourceField.id){
                // allow dropping to same allocation
                return
              }
              message.current = ` already has ${type} assigned`
              allocation.droppable = false;
              return;
        }
      }

    })

    // allow only dropping back to the same ElementList
    const newAllocationAttributes = {...allocationAttributes}
    for(let type in allocationAttributes){
      if(dragged.type !== type){
        newAllocationAttributes[type].droppable = false
      }
    }
    if(newAllocationAttributes !== allocationAttributes){
      setAllocationAttributes(newAllocationAttributes);
    }

    setAllocations(newAllocations);

  }

  useEffect(() => {
    const timeId = setTimeout(() => {
      setAlertType(null);
      setAlertMessage(null);
    }, 3000)

    return () => { clearTimeout(timeId) } 

  }, [alertType]);

  const [allocations, setAllocations] = useState([]);

  useEffect(() => {
    console.log(`${BASE_API_URL}allocations`)
    fetch(`${BASE_API_URL}allocations`)
    .then(response => {
      response.json().then((data => {
        let allocations = []
        data.forEach(allocation => {
          allocation.elements = []
          Object.values(allocationAttributes).map(e=>e.type).forEach(el=>{
            allocation[el].type = el
            allocation.elements.push(allocation[el])
            delete allocation[el]
          })
          allocations.push({...allocation, type: "allocation", droppable: true})
        })

        setAllocations(allocations);
      }))
    })
  },[])


  const handlePostDrop = (withinSame=false) => {

    // If user tried to drop on undroppable
    console.log('lastDroppedOn',lastDroppedOn)
    console.log('allocations',allocations)
    const allocation = allocations.find(e=>e.id===lastDroppedOn);
    if ( allocation && (!allocation.droppable) ) {
      if (!withinSame) {
        setAlertType("warning")
        let msg = [...`allocation ${allocation.id} ${message.current}`].join("")
        setAlertMessage(msg)
      }
    }

    // Re-enable drop on allocations
    const newAllocations = [...allocations]
    newAllocations.forEach(allocation=>{
      allocation.droppable = true;
    })
    const newAllocationAttributes = {...allocationAttributes}
    for(let key in newAllocationAttributes){
      newAllocationAttributes[key].droppable = true;
    }

    // Apply changes
    setAllocationAttributes(newAllocationAttributes);
    setAllocations(newAllocations)

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
    if( [...new Set([destination.droppableId, source.droppableId])].filter(e=>!e.includes("allocation")).length > 1){
      setAlertType("warning")
      setAlertMessage(`Cannot move between ${destination.droppableId} and ${source.droppableId}`)   
    }

    let sourceField;
    if(source.droppableId.includes('allocation')){
      let id = parseInt(source.droppableId.slice("allocation-".length))
      sourceField = allocations.find(e=>e.id===id);
    } else {
      sourceField = allocationAttributes[source.droppableId] 
    }

    let destinationField;
    if(destination.droppableId.includes('allocation')){
      let id = parseInt(destination.droppableId.slice("allocation-".length))
      destinationField = allocations.find(e=>e.id===id);
    } else {
      destinationField = allocationAttributes[destination.droppableId] 
    }


    // If the user drops within the same field, reorder field elements
    if (sourceField.id === destinationField.id && sourceField.type === destinationField.type) {
      const newField = reorderColumnList(
        sourceField,
        source.index,
        destination.index
      );

      if(newField.type !== "allocation") {
        // use saved useState setter to set elements
        newField.setElements(newField.elements)
      } else {
        const newAllocations = [...allocations]
        newAllocations.find(e=>e.id===newField.id).elements = newField.elements;
        newAllocations.forEach(allocation=>allocation.droppable=true)

        const newAllocationAttributes = {...allocationAttributes}
        for(let key in newAllocationAttributes){
          newAllocationAttributes[key].droppable = true;
        }

        // Apply changes
        setAllocationAttributes(newAllocationAttributes);
        setAllocations(newAllocations);
      }
  
      debugger;
  
      lastDroppedOn = null;
  
      debugger;

      handlePostDrop();
      return;
    }

    debugger;
    // If the user moves from one anything to another anything
    // const startElements = Array.from(sourceField.elements.map(el=>`${el.type}-${el.id}`));
    let [removed] = sourceField.elements.splice(source.index, 1);
    sourceField.droppable = true;

    destinationField.elements.splice(destination.index, 0, removed);

    allocations.forEach((allocation) => {
      allocation.droppable = true;
    })

    const boxes = [destinationField, sourceField];
    
    boxes.forEach(box=>{
      if(box.type !== "allocation") {
        // use saved useState setter to set elements
        box.setElements(box.elements)
      } else {
        allocations.find(e=>e.id===box.id).elements = box.elements;
      }
    })

    lastDroppedOn = null;

    const newAllocationAttributes = {...allocationAttributes}
    for(let key in newAllocationAttributes){
      newAllocationAttributes[key].droppable = true;
    }
    const newAllocations = [...allocations]
    newAllocations.forEach(allocation=>allocation.droppable=true)
    setAllocations(newAllocations);

  };

  const mouseUp = (event) => {

    let allocationId = event.target.attributes.getNamedItem('data-rbd-droppable-id')
    if (!allocationId) {
      return
    }
    allocationId = allocationId.value;
    lastDroppedOn = parseInt(allocationId.slice("allocation-".length));

    console.log('mouseUp', allocationId)
  
  }
  
  return (
    <>
      <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>

      <Box bg="main-bg" h="calc(100vh)">

        {// Render boxes for all Attributes - right now it's vehicles and cars
        Object.keys(allocationAttributes).map((key) => {
          let allocationAttr = allocationAttributes[key];
          const [elements, setElements] = useState([]);
          allocationAttr.elements = elements;
          allocationAttr.setElements = setElements;

          const url = allocationAttr.url;

          const elementList = <ElementList 
                                droppable={allocationAttr.droppable}
                                key={`${allocationAttr.type}-${allocationAttr.id}`} 
                                type={allocationAttr.type} url={url} 
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
          <Button colorScheme='green' onClick={addAllocation}>Add Allocation</Button>
          <Button colorScheme='green' onClick={saveAll}>Save All</Button>
          <SimpleGrid p={20} spacing={10} minChildWidth={250} color="white-text" bg="main-bg">

              {allocations.map((allocation) => {
                return (
                  <Box>
                    <span onMouseUp={mouseUp}>
                    <Allocation
                      key={allocation.id} 
                      allocation={allocation} 
                      setAllocations={setAllocations}
                      allocations={allocations}
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

const allocationAttributesData = {
  vehicle: {url :"vehicles", elements: null, setElements: null, type: 'vehicle', droppable: true},
  employee: {url :"employees", elements: null, setElements: null, type: 'employee', droppable: true},
};
