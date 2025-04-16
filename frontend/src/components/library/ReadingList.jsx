import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Menu,
  MenuItem,
  CircularProgress,
  Tooltip,
  Alert,
  ListItemIcon
} from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FolderIcon from '@mui/icons-material/Folder';
import CheckIcon from '@mui/icons-material/Check';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';

const ReadingList = () => {
  const [lists, setLists] = useState([
    {
      id: 'list-1',
      name: 'Programming Essentials',
      description: 'Must-read books for software developers',
      books: [
        { id: 'book-1', title: 'Clean Code', author: 'Robert C. Martin', progress: 45 },
        { id: 'book-2', title: 'Design Patterns', author: 'Erich Gamma et al.', progress: 20 },
      ]
    },
    {
      id: 'list-2',
      name: 'Data Science Fundamentals',
      description: 'Key resources for data science and ML',
      books: [
        { id: 'book-3', title: 'Python for Data Analysis', author: 'Wes McKinney', progress: 75 },
        { id: 'book-4', title: 'Hands-On Machine Learning', author: 'Aurélien Géron', progress: 10 },
        { id: 'book-5', title: 'Deep Learning', author: 'Ian Goodfellow', progress: 0 },
      ]
    }
  ]);

  const [activeList, setActiveList] = useState(lists[0]);
  const [openNewListDialog, setOpenNewListDialog] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedListId, setSelectedListId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleListMenuOpen = (event, listId) => {
    setAnchorEl(event.currentTarget);
    setSelectedListId(listId);
  };

  const handleListMenuClose = () => {
    setAnchorEl(null);
    setSelectedListId(null);
  };

  const handleCreateNewList = () => {
    if (!newListName.trim()) return;

    const newList = {
      id: `list-${Date.now()}`,
      name: newListName,
      description: newListDescription,
      books: []
    };

    setLists([...lists, newList]);
    setActiveList(newList);
    setNewListName('');
    setNewListDescription('');
    setOpenNewListDialog(false);
  };

  const handleDeleteList = (listId) => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const updatedLists = lists.filter(list => list.id !== listId);
      setLists(updatedLists);
      
      if (activeList.id === listId) {
        setActiveList(updatedLists[0] || null);
      }
      
      handleListMenuClose();
      setLoading(false);
    }, 600);
  };

  const handleDeleteBook = (bookId) => {
    const updatedBooks = activeList.books.filter(book => book.id !== bookId);
    const updatedList = { ...activeList, books: updatedBooks };
    
    const updatedLists = lists.map(list => 
      list.id === activeList.id ? updatedList : list
    );
    
    setLists(updatedLists);
    setActiveList(updatedList);
  };

  const handleSelectList = (list) => {
    setActiveList(list);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(activeList.books);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    const updatedList = { ...activeList, books: items };
    const updatedLists = lists.map(list => 
      list.id === activeList.id ? updatedList : list
    );
    
    setLists(updatedLists);
    setActiveList(updatedList);
  };

  const getProgressColor = (progress) => {
    if (progress === 0) return '#e0e0e0';
    if (progress < 25) return '#f44336';
    if (progress < 50) return '#ff9800';
    if (progress < 75) return '#2196f3';
    return '#4caf50';
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        borderRadius: 3,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography 
          variant="h5" 
          component="h2" 
          sx={{ 
            fontWeight: 600,
            position: 'relative',
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: 0,
              width: 40,
              height: 3,
              bgcolor: 'primary.main',
              borderRadius: 1
            }
          }}
        >
          My Reading Lists
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => setOpenNewListDialog(true)}
          size="small"
          sx={{ fontWeight: 500 }}
        >
          New List
        </Button>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Lists sidebar */}
        <Paper 
          variant="outlined" 
          sx={{ 
            width: { xs: '100%', md: 250 },
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <List sx={{ p: 0 }}>
            {lists.map((list, index) => (
              <motion.div
                key={list.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <ListItem 
                  button 
                  selected={activeList?.id === list.id}
                  onClick={() => handleSelectList(list)}
                  sx={{
                    borderLeft: '3px solid',
                    borderColor: activeList?.id === list.id ? 'primary.main' : 'transparent',
                    '&.Mui-selected': {
                      bgcolor: 'action.selected'
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: activeList?.id === list.id ? 'primary.main' : 'action.disabledBackground' }}>
                      <FolderIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={list.name} 
                    secondary={`${list.books.length} books`}
                    primaryTypographyProps={{ 
                      fontWeight: activeList?.id === list.id ? 600 : 400,
                      noWrap: true
                    }}
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      size="small"
                      onClick={(event) => handleListMenuOpen(event, list.id)}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < lists.length - 1 && <Divider />}
              </motion.div>
            ))}
          </List>
        </Paper>
        
        {/* Active list content */}
        <Box sx={{ flexGrow: 1 }}>
          {activeList ? (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  {activeList.name}
                </Typography>
                {activeList.description && (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {activeList.description}
                  </Typography>
                )}
              </Box>
              
              {activeList.books.length > 0 ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="books">
                    {(provided) => (
                      <Paper 
                        variant="outlined" 
                        sx={{ borderRadius: 2 }}
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        <List sx={{ p: 0 }}>
                          {activeList.books.map((book, index) => (
                            <Draggable key={book.id} draggableId={book.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <ListItem
                                    sx={{
                                      '&:hover': {
                                        bgcolor: 'action.hover'
                                      }
                                    }}
                                  >
                                    <ListItemAvatar>
                                      <Avatar sx={{ bgcolor: 'primary.light' }}>
                                        <AutoStoriesIcon />
                                      </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                      primary={book.title}
                                      secondary={book.author}
                                      primaryTypographyProps={{ fontWeight: 500 }}
                                    />
                                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                                      <Tooltip title={`${book.progress}% completed`}>
                                        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                          <CircularProgress
                                            variant="determinate"
                                            value={book.progress}
                                            size={36}
                                            thickness={4}
                                            sx={{ color: getProgressColor(book.progress) }}
                                          />
                                          {book.progress === 100 && (
                                            <Box
                                              sx={{
                                                top: 0,
                                                left: 0,
                                                bottom: 0,
                                                right: 0,
                                                position: 'absolute',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                              }}
                                            >
                                              <CheckIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                                            </Box>
                                          )}
                                        </Box>
                                      </Tooltip>
                                    </Box>
                                    <ListItemSecondaryAction>
                                      <IconButton
                                        edge="end"
                                        onClick={() => handleDeleteBook(book.id)}
                                        size="small"
                                        color="error"
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </ListItemSecondaryAction>
                                  </ListItem>
                                  {index < activeList.books.length - 1 && <Divider />}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </List>
                      </Paper>
                    )}
                  </Droppable>
                </DragDropContext>
              ) : (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  This list is empty. Add books to get started.
                </Alert>
              )}
            </>
          ) : (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Select a reading list or create a new one to begin.
            </Alert>
          )}
        </Box>
      </Box>
      
      {/* Create new list dialog */}
      <Dialog open={openNewListDialog} onClose={() => setOpenNewListDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Reading List</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="List Name"
            fullWidth
            variant="outlined"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (Optional)"
            fullWidth
            variant="outlined"
            multiline
            rows={2}
            value={newListDescription}
            onChange={(e) => setNewListDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewListDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateNewList} 
            variant="contained" 
            color="primary"
            disabled={!newListName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* List options menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleListMenuClose}
      >
        <MenuItem onClick={handleListMenuClose}>
          <ListItemIcon>
            <ArrowUpwardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Move Up</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleListMenuClose}>
          <ListItemIcon>
            <ArrowDownwardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Move Down</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => handleDeleteList(selectedListId)}
          disabled={loading}
        >
          <ListItemIcon>
            {loading ? (
              <CircularProgress size={20} color="error" />
            ) : (
              <DeleteIcon fontSize="small" color="error" />
            )}
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Delete List</ListItemText>
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default ReadingList; 