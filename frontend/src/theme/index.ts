import { createTheme, alpha } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#0A84FF',
            light: '#409CFF',
            dark: '#0066CC',
            contrastText: '#FFFFFF',
        },
        secondary: {
            main: '#5E5CE6',
            light: '#7D7AFF',
            dark: '#3634A3',
            contrastText: '#FFFFFF',
        },
        background: {
            default: '#000000',
            paper: 'rgba(28, 28, 30, 0.72)',
        },
        text: {
            primary: '#FFFFFF',
            secondary: 'rgba(235, 235, 245, 0.6)',
        },
        success: {
            main: '#30D158',
        },
        error: {
            main: '#FF453A',
        },
        warning: {
            main: '#FFD60A',
        },
        info: {
            main: '#64D2FF',
        },
        divider: 'rgba(84, 84, 88, 0.65)',
    },
    typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Roboto", sans-serif',
        h4: {
            fontWeight: 700,
            fontSize: '1.75rem',
            letterSpacing: '-0.02em',
        },
        h5: {
            fontWeight: 600,
            fontSize: '1.4rem',
            letterSpacing: '-0.015em',
        },
        h6: {
            fontWeight: 600,
            fontSize: '1.15rem',
            letterSpacing: '-0.01em',
        },
        subtitle1: {
            fontWeight: 500,
            fontSize: '0.95rem',
        },
        body1: {
            fontSize: '0.9rem',
            lineHeight: 1.5,
        },
        body2: {
            fontSize: '0.8rem',
            lineHeight: 1.45,
        },
        button: {
            fontWeight: 600,
            fontSize: '0.85rem',
        },
    },
    shape: {
        borderRadius: 16,
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(10, 132, 255, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(94, 92, 230, 0.06) 0%, transparent 50%)',
                    backgroundAttachment: 'fixed',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 50,
                    padding: '10px 24px',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                },
                contained: {
                    background: 'linear-gradient(180deg, #409CFF 0%, #0A84FF 100%)',
                    boxShadow: '0 4px 16px rgba(10, 132, 255, 0.35)',
                    '&:hover': {
                        background: 'linear-gradient(180deg, #5AAFFF 0%, #0A84FF 100%)',
                        boxShadow: '0 6px 24px rgba(10, 132, 255, 0.5)',
                        transform: 'scale(1.02)',
                    },
                    '&:active': {
                        transform: 'scale(0.97)',
                    },
                    '&.MuiButton-containedSuccess': {
                        background: 'linear-gradient(180deg, #4CD964 0%, #30D158 100%)',
                        boxShadow: '0 4px 16px rgba(48, 209, 88, 0.35)',
                        '&:hover': {
                            background: 'linear-gradient(180deg, #66E07A 0%, #30D158 100%)',
                            boxShadow: '0 6px 24px rgba(48, 209, 88, 0.5)',
                        },
                    },
                    '&.MuiButton-containedError': {
                        background: 'linear-gradient(180deg, #FF6961 0%, #FF453A 100%)',
                        boxShadow: '0 4px 16px rgba(255, 69, 58, 0.35)',
                        '&:hover': {
                            background: 'linear-gradient(180deg, #FF7D76 0%, #FF453A 100%)',
                            boxShadow: '0 6px 24px rgba(255, 69, 58, 0.5)',
                        },
                    },
                },
                outlined: {
                    borderColor: 'rgba(84, 84, 88, 0.65)',
                    backgroundColor: 'rgba(44, 44, 46, 0.4)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                        backgroundColor: 'rgba(10, 132, 255, 0.1)',
                        borderColor: 'rgba(10, 132, 255, 0.5)',
                        transform: 'scale(1.02)',
                    },
                    '&:active': {
                        transform: 'scale(0.97)',
                    },
                },
                text: {
                    color: '#0A84FF',
                    '&:hover': {
                        backgroundColor: 'rgba(10, 132, 255, 0.08)',
                    },
                },
                sizeSmall: {
                    padding: '6px 16px',
                    fontSize: '0.8rem',
                },
                sizeLarge: {
                    padding: '14px 32px',
                    fontSize: '1rem',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: 'rgba(28, 28, 30, 0.72)',
                    backdropFilter: 'blur(40px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                    border: '1px solid rgba(84, 84, 88, 0.36)',
                    borderRadius: 16,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: 'rgba(28, 28, 30, 0.72)',
                    backdropFilter: 'blur(40px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                    border: '1px solid rgba(84, 84, 88, 0.36)',
                    borderRadius: 20,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(84, 84, 88, 0.55)',
                    },
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    backgroundColor: 'rgba(36, 36, 38, 0.85)',
                    backdropFilter: 'blur(50px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(50px) saturate(200%)',
                    border: '1px solid rgba(84, 84, 88, 0.4)',
                    borderRadius: 20,
                    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.6)',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: 'rgba(22, 22, 24, 0.82)',
                    backdropFilter: 'blur(50px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(50px) saturate(180%)',
                    borderRight: '1px solid rgba(84, 84, 88, 0.36)',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(22, 22, 24, 0.72)',
                    backdropFilter: 'blur(40px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                    backgroundImage: 'none',
                    borderBottom: '1px solid rgba(84, 84, 88, 0.36)',
                    boxShadow: 'none',
                },
            },
        },
        MuiTableContainer: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    border: '1px solid rgba(84, 84, 88, 0.36)',
                    backgroundColor: 'rgba(28, 28, 30, 0.72)',
                    backdropFilter: 'blur(40px)',
                },
            },
        },
        MuiTableHead: {
            styleOverrides: {
                root: {
                    '& .MuiTableCell-head': {
                        backgroundColor: 'rgba(44, 44, 46, 0.8)',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'rgba(235, 235, 245, 0.6)',
                        borderBottom: '1px solid rgba(84, 84, 88, 0.36)',
                    },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: '1px solid rgba(84, 84, 88, 0.25)',
                    padding: '14px 16px',
                },
            },
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    transition: 'background-color 0.15s ease',
                    '&:hover': {
                        backgroundColor: 'rgba(10, 132, 255, 0.05)',
                    },
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 12,
                        backgroundColor: 'rgba(44, 44, 46, 0.5)',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.2s ease',
                        '& fieldset': {
                            borderColor: 'rgba(84, 84, 88, 0.4)',
                        },
                        '&:hover fieldset': {
                            borderColor: 'rgba(84, 84, 88, 0.7)',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#0A84FF',
                            boxShadow: '0 0 0 3px rgba(10, 132, 255, 0.15)',
                        },
                    },
                },
            },
        },
        MuiSelect: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    backgroundColor: 'rgba(44, 44, 46, 0.5)',
                    '& fieldset': {
                        borderColor: 'rgba(84, 84, 88, 0.4)',
                    },
                    '&:hover fieldset': {
                        borderColor: 'rgba(84, 84, 88, 0.7)',
                    },
                    '&.Mui-focused fieldset': {
                        borderColor: '#0A84FF',
                        boxShadow: '0 0 0 3px rgba(10, 132, 255, 0.15)',
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    fontWeight: 500,
                    backdropFilter: 'blur(10px)',
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        backgroundColor: 'rgba(10, 132, 255, 0.1)',
                    },
                },
            },
        },
        MuiListItem: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    marginBottom: 2,
                    transition: 'background-color 0.15s ease',
                    '&:hover': {
                        backgroundColor: 'rgba(10, 132, 255, 0.06)',
                    },
                },
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    margin: '2px 8px',
                    padding: '10px 16px',
                    transition: 'all 0.15s ease',
                    '&.Mui-selected': {
                        backgroundColor: 'rgba(10, 132, 255, 0.15)',
                        '&:hover': {
                            backgroundColor: 'rgba(10, 132, 255, 0.2)',
                        },
                    },
                    '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    },
                },
            },
        },
        MuiDivider: {
            styleOverrides: {
                root: {
                    borderColor: 'rgba(84, 84, 88, 0.36)',
                },
            },
        },
        MuiAutocomplete: {
            styleOverrides: {
                paper: {
                    backgroundColor: 'rgba(36, 36, 38, 0.92)',
                    backdropFilter: 'blur(50px) saturate(180%)',
                    border: '1px solid rgba(84, 84, 88, 0.4)',
                    borderRadius: 14,
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
                    marginTop: 4,
                },
                option: {
                    borderRadius: 8,
                    margin: '2px 6px',
                    padding: '10px 12px !important',
                    '&:hover': {
                        backgroundColor: 'rgba(10, 132, 255, 0.1) !important',
                    },
                    '&[aria-selected="true"]': {
                        backgroundColor: 'rgba(10, 132, 255, 0.18) !important',
                    },
                },
            },
        },
        MuiMenu: {
            styleOverrides: {
                paper: {
                    backgroundColor: 'rgba(36, 36, 38, 0.92)',
                    backdropFilter: 'blur(50px) saturate(180%)',
                    border: '1px solid rgba(84, 84, 88, 0.4)',
                    borderRadius: 14,
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
                },
            },
        },
        MuiMenuItem: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    margin: '2px 6px',
                    transition: 'background-color 0.12s ease',
                    '&:hover': {
                        backgroundColor: 'rgba(10, 132, 255, 0.1)',
                    },
                    '&.Mui-selected': {
                        backgroundColor: 'rgba(10, 132, 255, 0.15)',
                        '&:hover': {
                            backgroundColor: 'rgba(10, 132, 255, 0.2)',
                        },
                    },
                },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: 'rgba(44, 44, 46, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: 8,
                    fontSize: '0.75rem',
                    padding: '6px 12px',
                },
            },
        },
        MuiFormControl: {
            styleOverrides: {
                root: {
                    '& .MuiInputLabel-root': {
                        fontSize: '0.85rem',
                    },
                },
            },
        },
    },
});

export default theme;
