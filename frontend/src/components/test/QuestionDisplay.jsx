import React from 'react';
import {
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Checkbox,
  Button,
  Paper,
  Divider,
  TextField,
  useMediaQuery,
  useTheme,
  Chip
} from '@mui/material';
import { motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { BookmarkBorder as BookmarkIcon, Bookmark as BookmarkFilledIcon } from '@mui/icons-material';

const QuestionDisplay = ({ 
  question, 
  answer, 
  onAnswerChange, 
  onMarkForReview,
  status,
  onNext,
  onPrev
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // For match the following questions
  const [matchPairs, setMatchPairs] = React.useState(() => {
    if (question.type === 'matching' && answer) {
      return answer;
    }
    
    // Initialize with original order
    if (question.type === 'matching' && question.matchOptions) {
      return question.matchOptions.map((item, index) => ({
        id: item.id || `item-${index}`,
        text: item.text,
        matchedWith: null
      }));
    }
    
    return [];
  });
  
  // Handle match item drop
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = [...matchPairs];
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    
    setMatchPairs(items);
    onAnswerChange(items);
  };
  
  const handleAnswerChange = (event) => {
    onAnswerChange(event.target.value);
  };

  const handleCheckboxChange = (optionValue) => {
    const currentAnswers = answer ? answer.split(',') : [];
    const newAnswers = currentAnswers.includes(optionValue)
      ? currentAnswers.filter(a => a !== optionValue)
      : [...currentAnswers, optionValue];
    onAnswerChange(newAnswers.join(','));
  };
  
  // Helper function to get option text and value
  const getOptionInfo = (option) => {
    if (typeof option === 'object' && option !== null) {
      return {
        text: option.text || '',
        value: option._id || ''
      };
    }
    return {
      text: option,
      value: option
    };
  };
  
  // Is question marked for review
  const isMarkedForReview = status === 'marked-for-review';
  
  if (!question) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100%" 
        sx={{ flex: 1 }}
      >
        <Typography color="text.secondary">No question selected</Typography>
      </Box>
    );
  }
  
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: isMobile ? 2 : 3, 
        borderRadius: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Question header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        pb: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 1 : 0
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            label={`Q${question.questionNumber || '?'}`}
            color="primary"
            size={isMobile ? "small" : "medium"}
          />
          <Typography 
            variant={isMobile ? "body1" : "h6"} 
            fontWeight="bold"
            color="text.primary"
          >
            {question.title || `Question ${question.questionNumber}`}
          </Typography>
        </Box>
        <Button
          variant={isMarkedForReview ? "contained" : "outlined"}
          color="warning"
          onClick={onMarkForReview}
          size="small"
          startIcon={isMarkedForReview ? <BookmarkFilledIcon /> : <BookmarkIcon />}
          sx={{ width: isMobile ? '100%' : 'auto' }}
        >
          {isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}
        </Button>
      </Box>

      {/* Question text */}
      <Typography 
        variant="body1" 
        sx={{ 
          mb: 3, 
          whiteSpace: 'pre-wrap',
          p: isMobile ? 1.5 : 2,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          fontSize: isMobile ? '0.95rem' : '1rem',
          fontWeight: 500
        }}
      >
        {question.text}
      </Typography>

      {/* Options */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <FormControl component="fieldset" sx={{ width: '100%' }}>
          {/* Multiple choice questions (mcq type) */}
          {(question.type === 'multiple_choice' || question.type === 'mcq') && question.options && (
            <RadioGroup value={answer || ''} onChange={handleAnswerChange}>
              {question.options.map((option, index) => {
                const { text, value } = getOptionInfo(option);
                return (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      p: isMobile ? 1.5 : 2,
                      mb: 1.5,
                      borderRadius: 1.5,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: answer === value ? 'primary.main' : 'divider',
                      bgcolor: answer === value ? 
                        (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.15)' : 'rgba(25, 118, 210, 0.08)') : 
                        'background.paper',
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'dark' ? 
                          'rgba(255,255,255,0.05)' : 
                          'rgba(0,0,0,0.03)',
                        borderColor: theme.palette.mode === 'dark' ? 
                          'rgba(255,255,255,0.2)' : 
                          'rgba(0,0,0,0.2)',
                      },
                      transition: 'all 0.2s'
                    }}
                  >
                    <FormControlLabel
                      value={value}
                      control={<Radio />}
                      label={
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: isMobile ? '0.9rem' : '1rem',
                            fontWeight: answer === value ? 500 : 400
                          }}
                        >
                          {text}
                        </Typography>
                      }
                      sx={{ 
                        width: '100%', 
                        m: 0,
                        minHeight: isMobile ? '20px' : 'auto'
                      }}
                    />
                  </Paper>
                );
              })}
            </RadioGroup>
          )}

          {/* Multiple select questions */}
          {(question.type === 'multiple_select') && question.options && (
            <Box>
              {question.options.map((option, index) => {
                const { text, value } = getOptionInfo(option);
                const isSelected = answer ? answer.split(',').includes(value) : false;
                
                return (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      p: isMobile ? 1.5 : 2,
                      mb: 1.5,
                      borderRadius: 1.5,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      bgcolor: isSelected ? 
                        (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.15)' : 'rgba(25, 118, 210, 0.08)') : 
                        'background.paper',
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'dark' ? 
                          'rgba(255,255,255,0.05)' : 
                          'rgba(0,0,0,0.03)',
                        borderColor: theme.palette.mode === 'dark' ? 
                          'rgba(255,255,255,0.2)' : 
                          'rgba(0,0,0,0.2)',
                      },
                      transition: 'all 0.2s'
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleCheckboxChange(value)}
                        />
                      }
                      label={
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: isMobile ? '0.9rem' : '1rem',
                            fontWeight: isSelected ? 500 : 400
                          }}
                        >
                          {text}
                        </Typography>
                      }
                      sx={{ 
                        width: '100%', 
                        m: 0,
                        minHeight: isMobile ? '20px' : 'auto'
                      }}
                    />
                  </Paper>
                );
              })}
            </Box>
          )}

          {/* True/False questions */}
          {question.type === 'trueFalse' && (
            <RadioGroup value={answer || ''} onChange={handleAnswerChange}>
              {['True', 'False'].map((option, index) => {
                const value = option.toLowerCase();
                const isSelected = value === answer;
                
                return (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      p: isMobile ? 1.5 : 2,
                      mb: 1.5,
                      borderRadius: 1.5,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      bgcolor: isSelected ? 
                        (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.15)' : 'rgba(25, 118, 210, 0.08)') : 
                        'background.paper',
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'dark' ? 
                          'rgba(255,255,255,0.05)' : 
                          'rgba(0,0,0,0.03)',
                        borderColor: theme.palette.mode === 'dark' ? 
                          'rgba(255,255,255,0.2)' : 
                          'rgba(0,0,0,0.2)',
                      },
                      transition: 'all 0.2s'
                    }}
                  >
                    <FormControlLabel
                      value={value}
                      control={<Radio />}
                      label={
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: isMobile ? '0.9rem' : '1rem',
                            fontWeight: isSelected ? 500 : 400
                          }}
                        >
                          {option}
                        </Typography>
                      }
                      sx={{ 
                        width: '100%', 
                        m: 0,
                        minHeight: isMobile ? '20px' : 'auto'
                      }}
                    />
                  </Paper>
                );
              })}
            </RadioGroup>
          )}

          {/* Short answer and text questions */}
          {(question.type === 'text' || question.type === 'shortAnswer') && (
            <TextField
              fullWidth
              multiline
              rows={isMobile ? 3 : 4}
              value={answer || ''}
              onChange={handleAnswerChange}
              variant="outlined"
              placeholder="Type your answer here..."
              sx={{ mt: 1 }}
            />
          )}

          {/* Integer questions */}
          {question.type === 'integer' && (
            <TextField
              fullWidth
              type="number"
              value={answer || ''}
              onChange={handleAnswerChange}
              variant="outlined"
              placeholder="Enter your numerical answer..."
              InputProps={{
                inputProps: { 
                  step: 1
                }
              }}
              sx={{ mt: 1 }}
            />
          )}

          {/* Matching questions */}
          {question.type === 'matching' && question.matchOptions && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Match the following items by dragging them in the correct order:
              </Typography>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="matchingList">
                  {(provided) => (
                    <Box
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      sx={{ mt: 2 }}
                    >
                      {matchPairs.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided) => (
                            <Paper
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              elevation={1}
                              sx={{
                                p: 2,
                                mb: 1.5,
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                bgcolor: theme.palette.background.paper,
                                '&:hover': {
                                  bgcolor: theme.palette.mode === 'dark' ? 
                                    'rgba(255,255,255,0.05)' : 
                                    'rgba(0,0,0,0.03)',
                                }
                              }}
                            >
                              <Typography variant="body2">{item.text}</Typography>
                            </Paper>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </DragDropContext>
            </Box>
          )}

          {/* Default case: If question type is not recognized, display options if available */}
          {!['multiple_choice', 'mcq', 'multiple_select', 'trueFalse', 'text', 'shortAnswer', 'integer', 'matching'].includes(question.type) && 
           question.options && question.options.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Options:</Typography>
              <RadioGroup value={answer || ''} onChange={handleAnswerChange}>
                {question.options.map((option, index) => {
                  const { text, value } = getOptionInfo(option);
                  return (
                    <Paper
                      key={index}
                      elevation={0}
                      sx={{
                        p: isMobile ? 1.5 : 2,
                        mb: 1.5,
                        borderRadius: 1.5,
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: answer === value ? 'primary.main' : 'divider',
                        bgcolor: answer === value ? 
                          (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.15)' : 'rgba(25, 118, 210, 0.08)') : 
                          'background.paper',
                        '&:hover': {
                          bgcolor: theme.palette.mode === 'dark' ? 
                            'rgba(255,255,255,0.05)' : 
                            'rgba(0,0,0,0.03)',
                        },
                        transition: 'all 0.2s'
                      }}
                    >
                      <FormControlLabel
                        value={value}
                        control={<Radio />}
                        label={
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontSize: isMobile ? '0.9rem' : '1rem',
                              fontWeight: answer === value ? 500 : 400
                            }}
                          >
                            {text}
                          </Typography>
                        }
                        sx={{ 
                          width: '100%', 
                          m: 0,
                          minHeight: isMobile ? '20px' : 'auto'
                        }}
                      />
                    </Paper>
                  );
                })}
              </RadioGroup>
            </Box>
          )}
        </FormControl>
      </Box>

      {/* Navigation buttons - hide on mobile as we have floating nav buttons */}
      {isMobile && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mt: 3,
          pt: 2,
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          <Button
            variant="outlined"
            onClick={onPrev}
            disabled={!onPrev}
            size="small"
          >
            Previous
          </Button>
          <Button
            variant="outlined"
            onClick={onNext}
            disabled={!onNext}
            size="small"
          >
            Next
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default QuestionDisplay; 