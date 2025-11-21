import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { useGame } from "../../contexts/GameContext";
import { getThemeColors } from "../../constants/themes";
import { Trash2, FileText, BookOpen, Info, RefreshCcw, Download, Upload, TestTube } from "lucide-react-native";

export default function SettingsScreen() {
  const { state, theme, deleteFile, resetApp, exportBackup, restoreFromBackup, resetOnboarding } = useGame();
  const colors = getThemeColors(theme);
  const [restoreJson, setRestoreJson] = useState<string>("");
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleDeleteFile = (fileId: string, fileName: string) => {
    Alert.alert(
      "Delete Scripture",
      `Are you sure you want to delete "${fileName}"? This will remove all quotes from this file.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteFile(fileId);
          },
        },
      ]
    );
  };
  
  const handleResetApp = () => {
    Alert.alert(
      "Reset App",
      "Are you sure you want to reset the entire app? This will delete ALL data including:\n\n• All uploaded scriptures\n• Your character progress\n• All boons and equipment\n• All stats and achievements\n\nThis action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset Everything",
          style: "destructive",
          onPress: () => {
            resetApp();
            Alert.alert("Reset Complete", "The app has been reset. You can now start fresh!");
          },
        },
      ]
    );
  };
  
  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      console.log("[Settings] Starting backup export...");
      
      const json = exportBackup();
      
      if (!json || json.length === 0) {
        throw new Error("Generated backup is empty");
      }
      
      console.log("[Settings] Backup JSON generated, size:", (json.length / 1024).toFixed(1), "KB");
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
      const fileName = `verseforge-backup-${timestamp}.json`;
      
      if (Platform.OS === 'web') {
        console.log("[Settings] Using web download");
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        Alert.alert(
          "Backup Downloaded",
          `Your backup file "${fileName}" has been downloaded.\n\nKeep this file safe - you can use it to restore your progress later.`
        );
      } else {
        console.log("[Settings] Using native file system");
        try {
          console.log("[Settings] Creating file in cache:", fileName);
          const file = new File(Paths.cache, fileName);
          console.log("[Settings] File URI:", file.uri);
          
          console.log("[Settings] Creating file...");
          file.create({ overwrite: true });
          console.log("[Settings] File created successfully");
          
          console.log("[Settings] Writing content...");
          file.write(json);
          console.log("[Settings] Content written successfully, size:", json.length, "bytes");
          
          const canShare = await Sharing.isAvailableAsync();
          console.log("[Settings] Sharing available:", canShare);
          
          if (canShare) {
            await Sharing.shareAsync(file.uri, {
              mimeType: 'application/json',
              dialogTitle: 'Save Backup File',
              UTI: 'public.json',
            });
            
            Alert.alert(
              "Backup Created",
              `Your backup file has been created.\n\nSave it somewhere safe - you can use it to restore your progress later.`
            );
          } else {
            Alert.alert(
              "Backup Created",
              `Your backup has been saved to:\n${file.uri}\n\nNote: File sharing is not available on this device.`
            );
          }
        } catch (fileError) {
          console.error("[Settings] Native file operation failed:", fileError);
          console.error("[Settings] File error details:", {
            name: fileError instanceof Error ? fileError.name : 'Unknown',
            message: fileError instanceof Error ? fileError.message : String(fileError),
            stack: fileError instanceof Error ? fileError.stack : 'N/A',
          });
          throw fileError;
        }
      }
    } catch (error) {
      console.error("[Settings] Backup export failed:", error);
      console.error("[Settings] Error details:", {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack?.substring(0, 500) : 'N/A',
      });
      const errorMessage = error instanceof Error ? error.message : "Failed to create backup.";
      Alert.alert(
        "Export Failed", 
        `${errorMessage}\n\nPlease check the console logs for more details.`
      );
    } finally {
      setIsExporting(false);
    }
  };
  
  const handlePickFile = async () => {
    try {
      console.log("[Settings] Opening document picker...");
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });
      
      console.log("[Settings] Picker result:", result);
      
      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log("[Settings] Picker canceled or no file selected");
        return;
      }
      
      const file = result.assets[0];
      console.log("[Settings] File picked:", file.name, file.uri);
      
      try {
        if (Platform.OS === 'web') {
          console.log("[Settings] Reading file via fetch (web)");
          const response = await fetch(file.uri);
          const text = await response.text();
          console.log("[Settings] File read successfully, length:", text.length);
          setRestoreJson(text);
        } else {
          console.log("[Settings] Reading file via File API (native)");
          const fileObj = new File(file.uri);
          const text = await fileObj.text();
          console.log("[Settings] File read successfully, length:", text.length);
          setRestoreJson(text);
        }
        
        Alert.alert(
          "File Loaded",
          `Loaded backup from "${file.name}". Review and tap Restore when ready.`
        );
      } catch (readError) {
        console.error("[Settings] File read error:", readError);
        throw new Error(`Failed to read file: ${readError instanceof Error ? readError.message : String(readError)}`);
      }
    } catch (error) {
      console.error("[Settings] File picker error:", error);
      console.error("[Settings] Error details:", {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack?.substring(0, 300) : 'N/A',
      });
      Alert.alert(
        "Error",
        `Failed to load file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };
  
  const handleRestoreBackup = () => {
    if (!restoreJson.trim()) {
      Alert.alert("No Backup", "Please load a backup file or paste JSON in the text field.");
      return;
    }
    
    Alert.alert(
      "Restore Backup",
      "Restoring a backup will replace your current progress (XP, items, stats, etc.) with the data from this backup.\n\nAre you sure you want to continue?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Restore",
          style: "destructive",
          onPress: async () => {
            const result = await restoreFromBackup(restoreJson);
            if (result.success) {
              setRestoreJson("");
              Alert.alert(
                "Restore Complete",
                "Your backup has been restored successfully! All your progress is back.\n\nFor best results, you may want to close and reopen the app.",
                [
                  {
                    text: "OK",
                    onPress: () => {},
                  },
                ]
              );
            } else {
              Alert.alert(
                "Restore Failed",
                result.error || "Invalid or corrupt backup JSON. Please check your backup and try again."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Uploaded Scriptures
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Manage your uploaded text files
          </Text>
        </View>

        {state.parsedFiles.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <BookOpen size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No scriptures uploaded yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Upload text files from the Forge or Sanctum tabs to get started
            </Text>
          </View>
        ) : (
          <View style={styles.filesList}>
            {state.parsedFiles.map((file) => {
              const stats = state.scriptureStats[file.fileId];
              return (
                <View
                  key={file.fileId}
                  style={[styles.fileCard, { backgroundColor: colors.surface }]}
                >
                  <View style={styles.fileHeader}>
                    <FileText size={24} color={colors.primary} />
                    <View style={styles.fileInfo}>
                      <Text
                        style={[styles.fileName, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {file.fileName}
                      </Text>
                      <Text
                        style={[styles.fileQuotes, { color: colors.textSecondary }]}
                      >
                        {file.quotes.length} quotes parsed
                      </Text>
                    </View>
                  </View>

                  {stats && (
                    <View style={[styles.statsContainer, { backgroundColor: colors.surfaceHigh }]}>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.text }]}>
                          {stats.quotesRead}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                          Quotes Read
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.text }]}>
                          {stats.localLevel}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                          Level
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.primary }]}>
                          {stats.masteryTier}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                          Mastery
                        </Text>
                      </View>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.deleteButton, { backgroundColor: colors.error + "22" }]}
                    onPress={() => handleDeleteFile(file.fileId, file.fileName)}
                  >
                    <Trash2 size={18} color={colors.error} />
                    <Text style={[styles.deleteButtonText, { color: colors.error }]}>
                      Delete Scripture
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        <View style={[styles.infoCard, { backgroundColor: colors.primary + "22" }]}>
          <Info size={20} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.primary }]}>
              About Scripture Management
            </Text>
            <Text style={[styles.infoText, { color: colors.text }]}>
              Deleting a scripture will remove all its quotes from your library and reset its progress. Your global stats and boons will remain unchanged.
            </Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Backup & Restore
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Protect your progress by creating backups
          </Text>
        </View>
        
        <View style={[styles.backupCard, { backgroundColor: colors.surface }]}>
          <View style={styles.backupHeader}>
            <Download size={24} color={colors.primary} />
            <View style={styles.backupHeaderText}>
              <Text style={[styles.backupTitle, { color: colors.text }]}>
                Export Backup
              </Text>
              <Text style={[styles.backupDescription, { color: colors.textSecondary }]}>
                Create a JSON backup of all your data
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[
              styles.backupButton, 
              { backgroundColor: colors.primary },
              isExporting && { opacity: 0.6 }
            ]}
            onPress={handleExportBackup}
            disabled={isExporting}
          >
            <Download size={18} color="#FFF" />
            <Text style={styles.backupButtonText}>
              {isExporting ? "Creating Backup..." : "Download Backup File"}
            </Text>
          </TouchableOpacity>
          
          <View style={[styles.infoBox, { backgroundColor: colors.primary + "22" }]}>
            <Info size={16} color={colors.primary} />
            <Text style={[styles.infoBoxText, { color: colors.text }]}>
              {Platform.OS === 'web' 
                ? 'Your backup will be downloaded as a JSON file'
                : 'Your backup will be saved as a JSON file that you can share or save'}
            </Text>
          </View>
        </View>
        
        <View style={[styles.backupCard, { backgroundColor: colors.surface }]}>
          <View style={styles.backupHeader}>
            <Upload size={24} color={colors.primary} />
            <View style={styles.backupHeaderText}>
              <Text style={[styles.backupTitle, { color: colors.text }]}>
                Restore from Backup
              </Text>
              <Text style={[styles.backupDescription, { color: colors.textSecondary }]}>
                Load a backup file or paste JSON manually
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.pickFileButton, { backgroundColor: colors.surfaceHigh }]}
            onPress={handlePickFile}
          >
            <FileText size={18} color={colors.primary} />
            <Text style={[styles.pickFileText, { color: colors.text }]}>
              Choose Backup File
            </Text>
          </TouchableOpacity>
          
          <View style={styles.orDivider}>
            <View style={[styles.orLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.orText, { color: colors.textSecondary }]}>or paste manually</Text>
            <View style={[styles.orLine, { backgroundColor: colors.border }]} />
          </View>
          
          <TextInput
            style={[styles.restoreInput, { backgroundColor: colors.surfaceHigh, color: colors.text }]}
            placeholder="Paste your backup JSON here..."
            placeholderTextColor={colors.textSecondary}
            multiline
            value={restoreJson}
            onChangeText={setRestoreJson}
            numberOfLines={8}
            textAlignVertical="top"
          />
          
          <TouchableOpacity
            style={[
              styles.backupButton,
              { backgroundColor: colors.primary },
              !restoreJson.trim() && { opacity: 0.5 }
            ]}
            onPress={handleRestoreBackup}
            disabled={!restoreJson.trim()}
          >
            <Upload size={18} color="#FFF" />
            <Text style={styles.backupButtonText}>
              Restore Backup
            </Text>
          </TouchableOpacity>
          
          <View style={[styles.warningBox, { backgroundColor: colors.warning + "22" }]}>
            <Info size={16} color={colors.warning} />
            <Text style={[styles.warningText, { color: colors.warning }]}>
              Restoring will replace all current data
            </Text>
          </View>
        </View>
        
        <View style={styles.dangerZone}>
          <Text style={[styles.dangerZoneTitle, { color: colors.error }]}>
            Danger Zone
          </Text>
          
          <TouchableOpacity
            style={[styles.devButton, { backgroundColor: colors.warning }]}
            onPress={() => {
              Alert.alert(
                "Reset Onboarding",
                "This will clear your onboarding status so you can test the onboarding flow again.\n\nYour profile and data will be preserved.\n\nThis is a developer-only feature.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Reset Onboarding",
                    style: "destructive",
                    onPress: async () => {
                      const result = await resetOnboarding();
                      if (result.success) {
                        Alert.alert(
                          "Onboarding Reset",
                          "Close and reopen the app to see the onboarding flow.",
                          [
                            {
                              text: "OK",
                              onPress: () => {},
                            },
                          ]
                        );
                      } else {
                        Alert.alert(
                          "Error",
                          result.error || "Failed to reset onboarding status."
                        );
                      }
                    },
                  },
                ]
              );
            }}
          >
            <TestTube size={20} color="#FFF" />
            <Text style={styles.devButtonText}>
              Reset Onboarding (Dev)
            </Text>
          </TouchableOpacity>
          <Text style={[styles.devDescription, { color: colors.textSecondary }]}>
            Developer tool: Reset onboarding status to test the new user flow
          </Text>
          
          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: colors.error }]}
            onPress={handleResetApp}
          >
            <RefreshCcw size={20} color="#FFF" />
            <Text style={styles.resetButtonText}>
              Reset Entire App
            </Text>
          </TouchableOpacity>
          <Text style={[styles.dangerZoneDescription, { color: colors.textSecondary }]}>
            This will permanently delete all your data and start fresh as a new user.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  emptyCard: {
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600" as const,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  filesList: {
    gap: 16,
    marginBottom: 24,
  },
  fileCard: {
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  fileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  fileQuotes: {
    fontSize: 13,
  },
  statsContainer: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500" as const,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  infoCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
  dangerZone: {
    marginTop: 32,
    gap: 12,
  },
  dangerZoneTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  resetButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  dangerZoneDescription: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  backupCard: {
    padding: 20,
    borderRadius: 16,
    gap: 16,
    marginBottom: 16,
  },
  backupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backupHeaderText: {
    flex: 1,
  },
  backupTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  backupDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  backupButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  backupButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600" as const,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoBoxText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  restoreInput: {
    borderRadius: 12,
    padding: 12,
    fontSize: 12,
    fontFamily: "monospace",
    minHeight: 120,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  warningText: {
    fontSize: 12,
    fontWeight: "600" as const,
    flex: 1,
  },
  pickFileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  pickFileText: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  orDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 4,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  devButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  devButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  devDescription: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
});
