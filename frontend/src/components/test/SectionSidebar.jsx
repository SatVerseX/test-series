import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Divider,
  Paper
} from '@mui/material';

const SectionSidebar = ({ sections, currentSection, onSelectSection }) => {
  if (!sections || sections.length === 0) {
    return (
      <div className="p-4">
        <div className="p-2 text-sm text-gray-500 bg-gray-100 rounded-md dark:bg-gray-700 dark:text-gray-400">
          No sections available
        </div>
      </div>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto', mt: 2.5 }}>
      <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          Sections
        </Typography>
        <List>
          {sections.map((section, index) => (
            <React.Fragment key={index}>
              <ListItem disablePadding>
                <ListItemButton
                  selected={currentSection === index}
                  onClick={() => onSelectSection(index)}
                  sx={{
                    borderRadius: 1,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary={section.title}
                    secondary={`${section.questions} Questions`}
                  />
                </ListItemButton>
              </ListItem>
              {index < sections.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default SectionSidebar; 