import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import type { ReactNode } from "react";
import { alpha } from "@mui/material/styles";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import BalanceOutlinedIcon from "@mui/icons-material/BalanceOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import Chip from "@mui/material/Chip";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";

//Represents the helper buidling blocks that which make up small reuable pieces of the footer component. E.g heading with an icon, grey car, coloured table cell and location bullet 
const ColumnHeading = ({ icon, title }: { icon: ReactNode; title: string }) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        {icon}
        <Typography variant="subtitle1" fontWeight={500}>
            {title}
        </Typography>
    </Box>
);

const GreyCard = ({ children }: { children: ReactNode }) => (
    <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 1.25, mb: 1 }}>
        {children}
    </Box>
);

type Outcome = "good" | "bad" | "neutral";

const OutcomeCell = ({ label, type }: { label: string; type: Outcome }) => (
    <Box
        sx={(theme) => {
            const colour = type === "good" ? theme.palette.success : theme.palette.error;
            return {
                p: 0.75,
                borderRadius: 1,
                fontSize: 12,
                bgcolor: type === "neutral" ? theme.palette.action.hover : alpha(colour.main, 0.12),
                color: type === "neutral" ? theme.palette.text.primary : colour.dark,
            };
        }}
    >
        {label}
    </Box>
);

const efficiencyRows: { discount: string; above: [string, Outcome]; below: [string, Outcome] }[] = [
    { discount: "Deeper", above: ["Paid off", "good"], below: ["Lost money", "bad"] },
    { discount: "Same", above: ["Demand rose", "neutral"], below: ["Demand fell", "neutral"] },
    { discount: "Smaller", above: ["Held up", "good"], below: ["Discount worth keeping", "bad"] },
];

const LocationPoint = ({ icon, text }: { icon: ReactNode; text: string }) => (
    <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", mb: 1 }}>
        {icon}
        <Typography variant="body2">{text}</Typography>
    </Box>
);

const scoreParts = [
    { label: "Reach", weight: 25 },
    { label: "Loyalty", weight: 25 },
    { label: "Efficiency", weight: 25 },
    { label: "Location", weight: 25 },
];

//Represents the actual content inside the three columns of the footer component: text for reach and loyatly, the efficiency table and the location points
//This part uses the building blocks from the previous code block 
export const ScoreBreakdownFooter = () => {
    return (
        <Box
            component="footer"
            id="score-breakdown"
            sx={{
                mt: 4,
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                bgcolor: "background.paper",
                scrollMarginTop: "80px",
            }}
        >
            <Box
                sx={{
                    px: 2,
                    py: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    borderBottom: 1,
                    borderColor: "divider",
                }}
            >
                <InfoOutlinedIcon fontSize="small" color="action" />
                <Typography variant="subtitle2" color="text.secondary">
                    How the leaderboard is scored
                </Typography>
            </Box>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                }}
            >
                {/*Promotional effectiveness column */}
                <Box sx={{ p: 2, borderRight: { md: 1 }, borderColor: "divider" }}>
                    <ColumnHeading icon={<CampaignOutlinedIcon color="primary" />} title="Promotional effectiveness" />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Made up of two parts:
                    </Typography>
                    <GreyCard>
                        <Typography variant="body2" fontWeight={500}>Reach</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total customers the promotion reached
                        </Typography>
                    </GreyCard>
                    <GreyCard>
                        <Typography variant="body2" fontWeight={500}>Loyalty</Typography>
                        <Typography variant="body2" color="text.secondary">
                            How many of those customers came back during the promotion period
                        </Typography>
                    </GreyCard>
                </Box>

                {/*Efficiency column */}
                <Box sx={{ p: 2, borderRight: { md: 1 }, borderColor: "divider" }}>
                    <ColumnHeading icon={<BalanceOutlinedIcon color="primary" />} title="Efficiency" />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Did the promotion earn more than usual after paying for the discount? Each vendor
                        is compared with itself in the same period type in other years.
                    </Typography>
                    <GreyCard>
                        <Typography variant="body2">Net revenue per day ÷ benchmark</Typography>
                        <Typography variant="body2" color="text.secondary">Above 1 = better than usual</Typography>
                    </GreyCard>
                    <Box sx={{ display: "grid", gridTemplateColumns: "60px 1fr 1fr", gap: 0.5, fontSize: 12 }}> <Box />
                        <Typography variant="caption" color="text.secondary">Above 1</Typography>
                        <Typography variant="caption" color="text.secondary">Below 1</Typography>
                        {efficiencyRows.map((row) => (
                            <Box key={row.discount} sx={{ display: "contents" }}>
                                <Typography variant="caption" color="text.secondary">{row.discount}</Typography>
                                <OutcomeCell label={row.above[0]} type={row.above[1]} />
                                <OutcomeCell label={row.below[0]} type={row.below[1]} />
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/*Location column */}
                <Box sx={{ p: 2 }}>
                    <ColumnHeading icon={<PlaceOutlinedIcon color="primary" />} title="Location score" />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Compares each restaurant's address with the vendors around it.
                    </Typography>
                    <LocationPoint
                        icon={<ArrowUpwardIcon fontSize="small" color="success" />}
                        text="Near other vendor types: promotes cross-spending and brings in new customer types"
                    />
                    <LocationPoint
                        icon={<ArrowDownwardIcon fontSize="small" color="error" />}
                        text="Near vendors of the same type: less diversity in the customers in that area"
                    />
                    <GreyCard>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                            <StorefrontOutlinedIcon fontSize="small" />
                            <Typography variant="body2">
                                Like a mall: a restaurant in the food court scores lower than one outside it
                            </Typography>
                        </Box>
                    </GreyCard>
                </Box>
            </Box>

            {/* Score breakdown row; final section of the footer */}
            <Box sx={{ borderTop: 1, borderColor: "divider" }}>
                <Box sx={{ px: 2, pt: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                    <EmojiEventsOutlinedIcon fontSize="small" color="action" />
                    <Typography variant="subtitle2" color="text.secondary">
                        How each part affects your overall score (out of 100)
                    </Typography>
                </Box>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
                    <Box sx={{ p: 2, borderRight: { md: 1 }, borderColor: "divider" }}>
                        <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                            <Chip label="Reach 25%" size="small" color="primary" variant="outlined" />
                            <Chip label="Loyalty 25%" size="small" color="primary" variant="outlined" />
                        </Box>
                        <Typography variant="body2">
                            More customers reached and more returning customers raise your score.
                        </Typography>
                    </Box>

                    <Box sx={{ p: 2, borderRight: { md: 1 }, borderColor: "divider" }}>
                        <Box sx={{ mb: 1 }}>
                            <Chip label="Efficiency 25%" size="small" color="primary" variant="outlined" />
                        </Box>
                        <Typography variant="body2">
                            Earning more per day than your usual benchmark raises your score.
                        </Typography>
                    </Box>

                    <Box sx={{ p: 2 }}>
                        <Box sx={{ mb: 1 }}>
                            <Chip label="Location 25%" size="small" color="primary" variant="outlined" />
                        </Box>
                        <Typography variant="body2">
                            More nearby vendors of other types raise your score; more nearby restaurants lower it.
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ px: 2, pb: 2 }}>
                    <Box sx={{ display: "flex", height: 24, borderRadius: 1, overflow: "hidden", border: 1, borderColor: "divider" }}>
                        {scoreParts.map((part, index) => (
                            <Box
                                key={part.label}
                                sx={(theme) => ({
                                    flex: part.weight,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 12,
                                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                                    color: theme.palette.primary.dark,
                                    borderRight: index < scoreParts.length - 1 ? `1px solid ${theme.palette.divider}` : "none",
                                })}
                            >
                                {part.label} {part.weight}
                            </Box>
                        ))}
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "right", mt: 0.5 }}>
                        = 100 overall score
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};