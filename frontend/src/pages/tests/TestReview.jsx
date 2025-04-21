// ... existing code ...

const QuestionReview = ({ question, userAnswer, index }) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const theme = useTheme();

  const isCorrect = Array.isArray(question.correctAnswer)
    ? question.correctAnswer.every(ans => userAnswer.includes(ans)) && 
      userAnswer.length === question.correctAnswer.length
    : userAnswer === question.correctAnswer;

  const backgroundColor = isCorrect 
    ? alpha(theme.palette.success.main, 0.1)
    : alpha(theme.palette.error.main, 0.1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card 
        sx={{ 
          mb: 2, 
          backgroundColor,
          transition: 'background-color 0.3s ease'
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" mb={1}>
            {isCorrect ? (
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
            ) : (
              <CancelIcon color="error" sx={{ mr: 1 }} />
            )}
            <Typography variant="h6">
              Question {index + 1}
            </Typography>
          </Box>

          <Typography variant="body1" mb={2}>
            {question.text}
          </Typography>

          <Typography variant="subtitle2" color="textSecondary">
            Your Answer:
          </Typography>
          <Typography variant="body1" mb={1}>
            {Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer}
          </Typography>

          <Typography variant="subtitle2" color="textSecondary">
            Correct Answer:
          </Typography>
          <Typography variant="body1" mb={2}>
            {Array.isArray(question.correctAnswer) 
              ? question.correctAnswer.join(', ') 
              : question.correctAnswer}
          </Typography>

          {question.explanation && (
            <>
              <Button 
                onClick={() => setShowExplanation(!showExplanation)}
                variant="outlined"
                size="small"
                sx={{ mb: 1 }}
              >
                {showExplanation ? 'Hide' : 'Show'} Explanation
              </Button>
              <Collapse in={showExplanation}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    mt: 1, 
                    backgroundColor: alpha(theme.palette.background.paper, 0.6)
                  }}
                >
                  <Typography variant="body2">
                    {question.explanation}
                  </Typography>
                </Paper>
              </Collapse>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ... existing code ...