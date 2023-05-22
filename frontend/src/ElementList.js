import { Flex, Text } from "@chakra-ui/react";
import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { BASE_API_URL } from "./config";

import { Droppable } from "react-beautiful-dnd";

const Element = dynamic(() => import("./Element"), { ssr: false });
console.log(Element)


const ElementList = ({ type, url, elements, droppable, setElements }) => {

  useEffect(() => {
    fetch(`${BASE_API_URL}${url}`)
    .then(response => {
      response.json().then((data => {
        debugger;
        setElements(data
          .filter(e=>e.allocation===null)
          .map(e=>{return {...e, type}}))
      }))
    })
  },[])


  return (
    
    <Flex rounded="3px" bg="column-bg" h="220px" flexDir="row">
      <Flex
        align="center"
        h="60px"
        bg="column-header-bg"
        rounded="3px 3px 0 0"
        px="1.5rem"
        mb="1.5rem"
        id={type}
      >
        <Text fontSize="17px" fontWeight={600} color="subtle-text">
          { type }s       
        </Text>
      </Flex>
      <Droppable 
        droppableId={type} 
        direction="horizontal" 
        isDropDisabled={!droppable}

      >
        
        {(droppableProvided, droppableSnapshot) => (
          <Flex
            px="1.5rem"
            flex={1}
            style={{gap: "10px"}}
            ref={droppableProvided.innerRef}
            {...droppableProvided.droppableProps}
            
          >
            {
            elements.map((element, index) => 
              {
                return (<Element key={`${element.type}-${element.id}`} element={element} index={index} />)
              }
            )}
          </Flex>
        )}
      </Droppable>
    </Flex>
  );
};

export default ElementList;
