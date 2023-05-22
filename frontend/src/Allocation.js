import { Flex, Text, Input, InputGroup, InputRightElement } from "@chakra-ui/react";
import React, { useState, useRef } from "react";
import dynamic from "next/dynamic";

import { Droppable } from "react-beautiful-dnd";

const Element = dynamic(() => import("./Element"), { ssr: false });
console.log(Element)



const Allocation = ({ allocation, allocations, setAllocations }) => {
  
  const setDate = (event) => {
    const thisAllocation = {...allocations.find(e=>e.id === allocation.id)}
    thisAllocation.date = event.target.value
    const newAllocations = [...allocations]
    newAllocations[newAllocations.indexOf(allocation)] = thisAllocation;
    setAllocations(newAllocations)
  }

  return (
    
    <Flex rounded="3px" bg="column-bg" h="620px" flexDir="column">
      <Flex
        align="center"
        h="60px"
        bg="column-header-bg"
        rounded="3px 3px 0 0"
        px="1.5rem"
        mb="1.5rem"
        id={allocation.id}
      >
        <Text fontSize="17px" fontWeight={600} color="subtle-text">
          { `allocation-${allocation.id}` }
        </Text>
        <input 
          type="date" 
          onChange={setDate} 
          defaultValue={allocation.date}
          style={{"background-color": "#1A1D23", "margin-left": "10px"}}>
        </input>


      </Flex>
      <Droppable 
        droppableId={`allocation-${allocation.id}`} 
        direction="vertical" 
        isDropDisabled={!allocation.droppable}
      >
        {(droppableProvided, droppableSnapshot) => (
          <Flex
            px="1.5rem"
            flex={1}
            flexDir="column"
            ref={droppableProvided.innerRef}
            {...droppableProvided.droppableProps}
          >
            {
            allocation.elements.map((element, index) => (
              <Element key={`${element.type}-${element.id}`} element={element} index={index} />
            ))}
          </Flex>
        )}
      </Droppable>
    </Flex>
  );
};

export default Allocation;
