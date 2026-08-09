/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  TextField,
  Typography,
  Stack,
  Paper,
  InputAdornment,
  Button,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import PublicIcon from "@mui/icons-material/Public";
import AddIcon from "@mui/icons-material/Add";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import HistoryIcon from "@mui/icons-material/History";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import AddPurchaseCard from "./AddPurchaseCard";
import { colors, primaryAlpha } from "../themeColors";
import BarcodeScanner from "./BarcodeScanner";
import { lookupProductByBarcode } from "../utils/openFoodFacts";
import { getCurrentUserId } from "../utils/authUtils";
import { mapToAppCategory } from "../utils/categoryMapper";
import { mapToAppQuantityType } from "../utils/quantityTypeMapper";
import api, { foodPurchaseAPI } from "../api";

const cardSx = {
  borderRadius: 2.5,
  border: "none",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)",
  backgroundColor: "white",
};

function FoodResultRow({ item, badge, onClick }) {
  const subtitle = item.brand || item.category || item.categories?.split(",")?.[0] || "";

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        ...cardSx,
        p: 1.25,
        cursor: "pointer",
        transition: "box-shadow 0.2s ease, transform 0.15s ease",
        "&:hover": {
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          transform: "translateY(-1px)",
        },
        "&:active": { transform: "translateY(0)" },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.25}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            flexShrink: 0,
            backgroundColor: "rgba(0, 0, 0, 0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {item.image ? (
            <Box
              component="img"
              src={item.image}
              alt=""
              loading="lazy"
              sx={{ width: "100%", height: "100%", objectFit: "contain" }}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <Typography sx={{ fontSize: "1.5rem", lineHeight: 1 }}>
              {item.emoji || "🍽️"}
            </Typography>
          )}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, fontSize: "0.9rem", lineHeight: 1.3 }}
            noWrap
          >
            {item.name}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ display: "block", mt: 0.25 }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {badge}
        <ChevronRightIcon sx={{ color: "text.disabled", flexShrink: 0 }} />
      </Stack>
    </Paper>
  );
}

const FoodItemSearchDropdown = ({
  foodItems,
  handleAddToPurchase,
  addingPurchase = false,
  open,
  setHideNew,
  foodCategories,
  onScannedProduct,
  quantityTypes,
  onManualAdd,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [localResults, setLocalResults] = useState([]);
  const [offResults, setOffResults] = useState([]);
  const [popularResults, setPopularResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const searchSeqRef = useRef(0);

  const performUnifiedSearch = useCallback(async (term) => {
    const query = String(term || "").trim();
    if (query.length < 2) {
      setLocalResults([]);
      setOffResults([]);
      setPopularResults([]);
      setSearchError(null);
      setHasSearched(false);
      return;
    }

    const userId = getCurrentUserId();
    if (!userId) return;

    const seq = ++searchSeqRef.current;
    setSearching(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const response = await api.get("/api/food-items/search", {
        params: { term: query, user_id: userId },
      });

      if (seq !== searchSeqRef.current) return;

      const data = response.data;
      const local = data.local || [];
      const offRaw = data.openfoodfacts || [];

      const norm = (s) => String(s || "").trim().toLowerCase();
      const localNameSet = new Set(local.map((i) => norm(i.name)).filter(Boolean));
      const seenOffKey = new Set();
      const off = [];
      for (const p of offRaw) {
        const nameKey = norm(p?.name);
        if (!nameKey || localNameSet.has(nameKey)) continue;
        const offKey = `${nameKey}::${norm(p?.brand)}`;
        if (seenOffKey.has(offKey)) continue;
        seenOffKey.add(offKey);
        off.push(p);
      }

      setLocalResults(local);
      setOffResults(off);

      try {
        const recentResponse = await foodPurchaseAPI.getRecentPurchases({
          user_id: userId,
          limit: 50,
        });
        if (seq !== searchSeqRef.current) return;
        const q = query.toLowerCase();
        setPopularResults(
          (recentResponse.data || []).filter((item) =>
            item.name?.toLowerCase().includes(q)
          )
        );
      } catch {
        if (seq === searchSeqRef.current) setPopularResults([]);
      }

      if (data.error) {
        if (data.error.type === "RATE_LIMITED") {
          setSearchError(
            `Rate limit exceeded. Wait ${data.error.retryAfter || 60}s. Local results are still shown.`
          );
        } else {
          setSearchError("Could not reach Open Food Facts. Local results are still shown.");
        }
      } else {
        setSearchError(null);
      }
    } catch (error) {
      if (seq !== searchSeqRef.current) return;
      console.error("Error performing unified search:", error);
      setLocalResults([]);
      setOffResults([]);
      setPopularResults([]);
      setSearchError("Search failed. Please try again.");
    } finally {
      if (seq === searchSeqRef.current) setSearching(false);
    }
  }, []);

  useEffect(() => {
    const query = searchTerm.trim();
    if (query.length < 2) {
      setLocalResults([]);
      setOffResults([]);
      setPopularResults([]);
      setSearchError(null);
      setHasSearched(false);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(() => {
      performUnifiedSearch(query);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm, performUnifiedSearch]);

  useEffect(() => {
    setHideNew(!!selectedItem);
  }, [selectedItem, setHideNew]);

  const handleScan = async (barcode) => {
    setScannerOpen(false);
    setScanning(true);
    setScanError(null);

    try {
      const result = await lookupProductByBarcode(barcode);

      if (result.success && result.product) {
        if (onScannedProduct) {
          onScannedProduct(result.product);
        } else {
          const matchingItem = foodItems.find(
            (item) => item.name.toLowerCase() === result.product.name.toLowerCase()
          );
          if (matchingItem) {
            setSelectedItem(matchingItem);
          } else {
            setScanError("Product found but not in your list. Add it manually.");
          }
        }
      } else if (result.error === "RATE_LIMITED") {
        setScanError(`Too many requests. Wait ${result.retryAfter || 60}s and try again.`);
      } else if (result.error === "NOT_FOUND") {
        setScanError("Product not found. Enter details manually.");
      } else {
        setScanError(result.message || "Barcode lookup failed.");
      }
    } catch (error) {
      console.error("Error processing scan:", error);
      setScanError("An error occurred while processing the barcode.");
    } finally {
      setScanning(false);
    }
  };

  const buildOffItem = (product) => {
    const suggestedCategoryId = mapToAppCategory(product.categories_tags, foodCategories);
    const suggestedCategoryName = suggestedCategoryId
      ? foodCategories.find((c) => c.id === suggestedCategoryId)?.name || null
      : null;
    const suggestedQuantityTypeId = mapToAppQuantityType(product.quantity, quantityTypes);
    const suggestedQuantityTypeName = suggestedQuantityTypeId
      ? quantityTypes.find((q) => q.id === suggestedQuantityTypeId)?.name || null
      : null;

    return {
      name: product.name,
      category: suggestedCategoryName,
      category_id: suggestedCategoryId,
      price: 0,
      quantity: 1,
      quantity_type: suggestedQuantityTypeName,
      quantity_type_id: suggestedQuantityTypeId,
      source: "openfoodfacts",
      barcode: product.barcode,
      brand: product.brand || "",
      categories_tags: product.categories_tags || [],
      ingredients_text: product.ingredients || "",
      image: product.image,
      _offProduct: product,
    };
  };

  const hasResults =
    popularResults.length > 0 || localResults.length > 0 || offResults.length > 0;

  if (!open) return null;

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          width: "100%",
        }}
      >
        {selectedItem ? (
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              minHeight: 0,
              pt: 2,
              pb: 2.5,
            }}
          >
            <AddPurchaseCard
              setSelectedItem={setSelectedItem}
              item={selectedItem}
              quantityTypes={quantityTypes}
              foodCategories={foodCategories}
              submitting={addingPurchase}
              handleAddPurchase={async (purchase) => {
                const result = await handleAddToPurchase(purchase);
                if (result === true) {
                  setSelectedItem(null);
                }
              }}
            />
          </Box>
        ) : (
          <>
            <Box sx={{ flexShrink: 0, pt: 2, pb: 1.5 }}>
              <TextField
                variant="outlined"
                placeholder="Search by name (e.g. potato, milk)…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                fullWidth
                autoFocus
                sx={{
                  mb: 1.5,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2.5,
                    backgroundColor: "white",
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searching ? (
                    <InputAdornment position="end">
                      <CircularProgress size={18} />
                    </InputAdornment>
                  ) : null,
                }}
              />

              <Stack direction="row" spacing={1}>
                {onManualAdd && (
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={onManualAdd}
                    sx={{
                      flex: 1,
                      borderRadius: 2.5,
                      textTransform: "none",
                      fontWeight: 600,
                      minHeight: 40,
                    }}
                  >
                    Manual entry
                  </Button>
                )}
                <Button
                  variant="outlined"
                  startIcon={<QrCodeScannerIcon />}
                  onClick={() => setScannerOpen(true)}
                  sx={{
                    flex: 1,
                    borderRadius: 2.5,
                    textTransform: "none",
                    fontWeight: 600,
                    minHeight: 40,
                  }}
                >
                  Scan barcode
                </Button>
              </Stack>
            </Box>

            {scanning && (
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 1 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Looking up product…
                </Typography>
              </Stack>
            )}

            {(scanError || searchError) && (
              <Alert
                severity={searchError?.includes("Rate limit") ? "warning" : "error"}
                onClose={() => {
                  setScanError(null);
                  setSearchError(null);
                }}
                sx={{ mb: 1.5, borderRadius: 2 }}
              >
                {scanError || searchError}
              </Alert>
            )}

            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                overflowX: "hidden",
                pb: 2,
              }}
            >
              {searchTerm.trim().length < 2 && !hasResults && (
                <Paper
                  elevation={0}
                  sx={{ ...cardSx, p: 3, textAlign: "center" }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                    Type at least 2 characters to search your saved items and Open Food Facts.
                  </Typography>
                </Paper>
              )}

              {hasResults && (
                <Stack spacing={2}>
                  {popularResults.length > 0 && (
                    <Box>
                      <Typography
                        variant="overline"
                        sx={{
                          display: "block",
                          mb: 1,
                          color: "text.secondary",
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                        }}
                      >
                        Recent matches
                      </Typography>
                      <Stack spacing={1}>
                        {popularResults.map((item, index) => (
                          <FoodResultRow
                            key={`popular-${item.id || item.name}-${index}`}
                            item={item}
                            badge={
                              <Chip
                                icon={<HistoryIcon sx={{ fontSize: "14px !important" }} />}
                                label="Recent"
                                size="small"
                                sx={{
                                  height: 24,
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  backgroundColor: primaryAlpha(0.15),
                                  color: colors.primary,
                                  "& .MuiChip-icon": { color: colors.primary },
                                }}
                              />
                            }
                            onClick={() => setSelectedItem(item)}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {localResults.length > 0 && (
                    <Box>
                      <Typography
                        variant="overline"
                        sx={{
                          display: "block",
                          mb: 1,
                          color: "text.secondary",
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                        }}
                      >
                        Your food items
                      </Typography>
                      <Stack spacing={1}>
                        {localResults.map((item) => (
                          <FoodResultRow
                            key={item.id}
                            item={item}
                            badge={
                              <Chip
                                icon={<BookmarkIcon sx={{ fontSize: "14px !important" }} />}
                                label="Saved"
                                size="small"
                                sx={{
                                  height: 24,
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  backgroundColor: "rgba(46, 125, 50, 0.12)",
                                  color: "success.dark",
                                  "& .MuiChip-icon": { color: "success.dark" },
                                }}
                              />
                            }
                            onClick={() => setSelectedItem(item)}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {offResults.length > 0 && (
                    <Box>
                      <Typography
                        variant="overline"
                        sx={{
                          display: "block",
                          mb: 1,
                          color: "text.secondary",
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                        }}
                      >
                        Open Food Facts
                      </Typography>
                      <Stack spacing={1}>
                        {offResults.map((product, index) => (
                          <FoodResultRow
                            key={product.barcode || `off-${index}`}
                            item={{
                              ...product,
                              category: product.categories?.split(",")?.[0]?.trim(),
                            }}
                            badge={
                              <Box
                                sx={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: 1.5,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                  backgroundColor: primaryAlpha(0.12),
                                  color: "primary.main",
                                }}
                              >
                                <PublicIcon sx={{ fontSize: 14 }} />
                              </Box>
                            }
                            onClick={() => setSelectedItem(buildOffItem(product))}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              )}

              {hasSearched && !searching && !hasResults && searchTerm.trim().length >= 2 && (
                <Paper elevation={0} sx={{ ...cardSx, p: 3, textAlign: "center" }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    No results for &ldquo;{searchTerm.trim()}&rdquo;
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Try a different spelling or add the item manually.
                  </Typography>
                  {onManualAdd && (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={onManualAdd}>
                      Add manually
                    </Button>
                  )}
                </Paper>
              )}
            </Box>
          </>
        )}
      </Box>

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
        onError={(err) => setScanError(err)}
        onManualAdd={() => {
          setScannerOpen(false);
          if (onManualAdd) onManualAdd();
        }}
      />
    </>
  );
};

export default FoodItemSearchDropdown;
