import { Flex, Text, Box } from "@chakra-ui/react";
import React from "react";
import { Draggable } from "react-beautiful-dnd";

const Element = ({ element, index }) => {
  return (
    <>
      <Draggable key={element.id} draggableId={`${element.type}-${element.id}`}  index={index}>
        {(draggableProvided, draggableSnapshot) => (
          <Box
            color="white-text"
            mb="1rem"
            w="calc(9vw)"
            h="172px"
            bg="card-bg"
            rounded="3px"
            p="1.5rem"
            outline="2px solid"
            outlineColor={
              draggableSnapshot.isDragging
                ? "card-border"
                : "transparent"
            }
            boxShadow={
              draggableSnapshot.isDragging
                ? "0 5px 10px rgba(0, 0, 0, 0.6)"
                : "unset"
            }
            ref={draggableProvided.innerRef}
            {...draggableProvided.draggableProps}
            {...draggableProvided.dragHandleProps}
          >

            <Text>

              {`${element.type}-${element.id}`}
              {
                Object.keys(element).filter(e=>!["id", "shipment"].includes(e)).map((key) => {
                  return <div>{key}: {element[key]}</div>
                })
              }
            </Text>
          </Box>
        )}
      </Draggable>
    </>

  );
};

export default Element;
