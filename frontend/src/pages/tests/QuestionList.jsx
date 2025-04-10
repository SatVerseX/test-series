import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  Box,
  Chip,
  Divider,
  Paper
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const getQuestionTypeColor = (type) => {
  switch (type) {
    case 'mcq':
      return 'primary';
    case 'true_false':
      return 'success';
    case 'short_answer':
      return 'warning';
    case 'integer':
      return 'info';
    default:
      return 'default';
  }
};

const getQuestionTypeLabel = (type) => {
  switch (type) {
    case 'mcq':
      return 'Multiple Choice';
    case 'true_false':
      return 'True/False';
    case 'short_answer':
      return 'Short Answer';
    case 'integer':
      return 'Integer';
    default:
      return type;
  }
};

const QuestionList = ({ 
  questions = [], 
  onEdit = () => {}, 
  onDelete = () => {}, 
  onReorder = () => {} 
}) => {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex !== destinationIndex) {
      onReorder(sourceIndex, destinationIndex);
    }
  };

  if (questions.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No questions added yet. Add a question using the form above.
        </Typography>
      </Paper>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="questions">
        {(provided) => (
          <List
            {...provided.droppableProps}
            ref={provided.innerRef}
            sx={{ width: '100%' }}
          >
            {questions.map((question, index) => (
              <Draggable
                key={question._id || index}
                draggableId={question._id || `question-${index}`}
                index={index}
              >
                {(provided) => (
                  <ListItem
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      gap: 1,
                      mb: 2,
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      boxShadow: 1
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">
                          Q{index + 1}.
                        </Typography>
                        <Chip
                          label={getQuestionTypeLabel(question.type)}
                          color={getQuestionTypeColor(question.type)}
                          size="small"
                        />
                        <Chip
                          label={`${question.marks} marks`}
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => onEdit(index)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => onDelete(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    <Typography variant="body1">
                      {question.text}
                    </Typography>

                    {question.type === 'mcq' && (
                      <Box sx={{ pl: 2 }}>
                        {question.options.map((option, optIndex) => (
                          <Typography
                            key={optIndex}
                            variant="body2"
                            color={option === question.correctAnswer ? 'success.main' : 'text.secondary'}
                            sx={{
                              fontWeight: option === question.correctAnswer ? 'bold' : 'normal'
                            }}
                          >
                            {String.fromCharCode(65 + optIndex)}. {option}
                          </Typography>
                        ))}
                      </Box>
                    )}

                    {question.type !== 'mcq' && (
                      <Box sx={{ pl: 2 }}>
                        <Typography variant="body2" color="success.main">
                          Correct Answer: {question.correctAnswer}
                        </Typography>
                      </Box>
                    )}

                    {question.explanation && (
                      <Box sx={{ pl: 2, mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Explanation:</strong> {question.explanation}
                        </Typography>
                      </Box>
                    )}

                    {index < questions.length - 1 && <Divider sx={{ my: 1 }} />}
                  </ListItem>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </List>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default QuestionList;
