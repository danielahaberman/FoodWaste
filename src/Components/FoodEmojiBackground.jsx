import React, { useMemo } from 'react';
import { Box } from '@mui/material';

const FoodEmojiBackground = ({ children, opacity = 0.25, ...props }) => {
  // Large pool of unique food emojis
  const foodEmojis = [
    // Fruits
    '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆',
    // Vegetables
    '🥕', '🌽', '🌶️', '🫑', '🥒', '🥬', '🥦', '🧄', '🧅', '🥔', '🍠', '🌰', '🫘',
    // Proteins
    '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🥪', '🌮', '🌯', '🫔', '🥙', '🧆', '🥚', '🍳', '🥞', '🧇',
    '🐟', '🐠', '🐡', '🦐', '🦞', '🦀', '🦑', '🐙', '🦪', '🍤', '🍥',
    // Dairy & Grains
    '🥛', '🍼', '🫗', '☕', '🫖', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾',
    '🍞', '🥖', '🥨', '🥯', '🧀', '🧈',
    // Desserts & Sweets
    '🍰', '🧁', '🥧', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🥜', '🍯',
    // Other foods
    '🥟', '🥠', '🥡', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍢', '🍣', '🥮', '🍡'
  ];

  // Use useMemo to prevent re-randomization on every render
  const selectedEmojis = useMemo(() => {
    // Remove duplicates and select 50 unique emojis
    const uniqueEmojis = [...new Set(foodEmojis)];
    const shuffled = [...uniqueEmojis].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 50);
  }, []); // Empty dependency array means this only runs once

  // Predefined organized positions (like the original layout)
  const positions = [
    // Row 1
    { top: '10%', left: '5%' }, { top: '15%', left: '15%' }, { top: '8%', left: '25%' }, 
    { top: '12%', left: '35%' }, { top: '6%', left: '45%' }, { top: '18%', left: '55%' }, 
    { top: '14%', left: '65%' }, { top: '10%', left: '75%' }, { top: '16%', left: '85%' }, 
    { top: '20%', left: '95%' },
    // Row 2
    { top: '30%', left: '8%' }, { top: '35%', left: '18%' }, { top: '28%', left: '28%' }, 
    { top: '32%', left: '38%' }, { top: '26%', left: '48%' }, { top: '38%', left: '58%' }, 
    { top: '34%', left: '68%' }, { top: '30%', left: '78%' }, { top: '36%', left: '88%' }, 
    { top: '40%', left: '98%' },
    // Row 3
    { top: '50%', left: '3%' }, { top: '55%', left: '13%' }, { top: '48%', left: '23%' }, 
    { top: '52%', left: '33%' }, { top: '46%', left: '43%' }, { top: '58%', left: '53%' }, 
    { top: '54%', left: '63%' }, { top: '50%', left: '73%' }, { top: '56%', left: '83%' }, 
    { top: '60%', left: '93%' },
    // Row 4
    { top: '70%', left: '6%' }, { top: '75%', left: '16%' }, { top: '68%', left: '26%' }, 
    { top: '72%', left: '36%' }, { top: '66%', left: '46%' }, { top: '78%', left: '56%' }, 
    { top: '74%', left: '66%' }, { top: '70%', left: '76%' }, { top: '76%', left: '86%' }, 
    { top: '80%', left: '96%' },
    // Row 5
    { top: '90%', left: '10%' }, { top: '85%', left: '20%' }, { top: '88%', left: '30%' }, 
    { top: '92%', left: '40%' }, { top: '86%', left: '50%' }, { top: '94%', left: '60%' }, 
    { top: '90%', left: '70%' }, { top: '88%', left: '80%' }, { top: '92%', left: '90%' },
    { top: '95%', left: '100%' }
  ];
  return (
    <Box
      sx={{
        width: "100%", 
        height: "100vh",
        maxWidth: { xs: "100vw", sm: "600px" },
        margin: { xs: 0, sm: "0 auto" },
        position: "relative",
        background: `
          radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.05) 0%, transparent 50%),
          linear-gradient(135deg, rgba(245, 247, 250, 0.8) 0%, rgba(195, 207, 226, 0.8) 100%)
        `,
        overflow: "hidden",
        boxSizing: "border-box",
        padding: 0,
        ...props
      }}
    >
      {/* Food Emoji Background */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          fontSize: { xs: '2rem', sm: '3rem', md: '4rem' },
          opacity: opacity,
          zIndex: 0,
          '& > span': {
            position: 'absolute',
            animation: 'float 6s ease-in-out infinite',
            '&:nth-of-type(odd)': {
              animationDelay: '0s'
            },
            '&:nth-of-type(even)': {
              animationDelay: '3s'
            }
          },
          '@keyframes float': {
            '0%, 100%': {
              transform: 'translateY(0px) rotate(0deg)'
            },
            '50%': {
              transform: 'translateY(-20px) rotate(5deg)'
            }
          }
        }}
      >
        {/* Organized positioned food emojis */}
        {selectedEmojis.slice(0, positions.length).map((emoji, index) => (
          <span 
            key={index} 
            style={{ 
              top: positions[index].top, 
              left: positions[index].left,
              animationDelay: `${index * 0.1}s`
            }}
          >
            {emoji}
          </span>
        ))}
      </Box>

      {/* Content */}
      <Box sx={{ position: 'relative', zIndex: 1, width: '100%', height: '100%',}}>
        {children}
      </Box>
    </Box>
  );
};

export default FoodEmojiBackground;
