import React from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Modal } from 'react-native';
import { Text, Card, Chip, Button } from 'react-native-paper';
import { Colors } from '../theme/colors';
import {
    Leaf,
    Wind,
    Droplets,
    TreeDeciduous,
    CheckCircle2,
    BookOpen,
    Info,
    X,
    Check,
    Award
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const ECO_FACTS = [
    {
        id: '1',
        title: 'Trees and Oxygen',
        description: 'A mature tree produces enough oxygen for 2 people per year and absorbs up to 48 pounds of CO2 annually.',
        icon: Leaf,
        color: '#4CAF50',
        bg: '#E8F5E9'
    },
    {
        id: '2',
        title: 'Air Quality',
        description: 'Urban trees reduce air temperature by 2-8°C and can lower air conditioning needs by 30%.',
        icon: Wind,
        color: '#00BCD4',
        bg: '#E0F7FA'
    },
    {
        id: '3',
        title: 'Water Conservation',
        description: 'Trees help prevent water pollution by filtering runoff and reducing soil erosion by up to 75%.',
        icon: Droplets,
        color: '#2196F3',
        bg: '#E3F2FD'
    }
];

const TREE_SPECIES_BENEFITS = [
    {
        id: 'oak',
        name: 'Oak Tree',
        oxygen: '118 kg/year',
        co2: '48 kg/year',
        benefits: [
            'Excellent for wildlife habitat',
            'Strong carbon sequestration',
            'Long lifespan (200+ years)'
        ],
        color: '#43A047'
    },
    {
        id: 'pine',
        name: 'Pine Tree',
        oxygen: '95 kg/year',
        co2: '40 kg/year',
        benefits: [
            'Fast-growing evergreen',
            'Provides year-round oxygen',
            'Soil erosion prevention'
        ],
        color: '#00897B'
    },
    {
        id: 'maple',
        name: 'Maple Tree',
        oxygen: '110 kg/year',
        co2: '45 kg/year',
        benefits: [
            'Beautiful fall foliage',
            'Good shade provider',
            'Adaptable to urban soil'
        ],
        color: '#FB8C00'
    }
];

const QUESTIONS = [
    {
        id: 1,
        question: "How much CO₂ can a mature tree absorb annually?",
        options: ["10 lbs", "48 lbs", "100 lbs", "1 ton"],
        answer: 1 // Index of correct answer
    },
    {
        id: 2,
        question: "Which gas do trees release that we need to breathe?",
        options: ["Carbon Dioxide", "Nitrogen", "Oxygen", "Methane"],
        answer: 2
    },
    {
        id: 3,
        question: "Urban trees can lower air temperature by how much?",
        options: ["0.5-1°C", "2-8°C", "10-15°C", "They make it hotter"],
        answer: 1
    },
    {
        id: 4,
        question: "What is the main cause of global warming?",
        options: ["Solar flares", "Greenhouse gases", "Volcanic eruptions", "Ocean tides"],
        answer: 1
    },
    {
        id: 5,
        question: "Which of these is a renewable energy source?",
        options: ["Coal", "Natural Gas", "Solar Power", "Oil"],
        answer: 2
    }
];

export const KnowledgeHub = () => {
    const [showQuiz, setShowQuiz] = React.useState(false);
    const [currentQuestion, setCurrentQuestion] = React.useState(0);
    const [score, setScore] = React.useState(0);
    const [showResult, setShowResult] = React.useState(false);

    const handleAnswer = (optionIndex: number) => {
        if (optionIndex === QUESTIONS[currentQuestion].answer) {
            setScore(score + 1);
        }

        if (currentQuestion < QUESTIONS.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            setShowResult(true);
        }
    };

    const resetQuiz = () => {
        setShowQuiz(false);
        setCurrentQuestion(0);
        setScore(0);
        setShowResult(false);
    };

    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Knowledge Hub</Text>
                    <Text style={styles.headerSubtitle}>Learn about the environment and test your knowledge</Text>
                </View>

                <Text style={styles.sectionTitle}>Daily Eco Facts</Text>
                <View style={styles.factsContainer}>
                    {ECO_FACTS.map((fact) => (
                        <Card key={fact.id} style={styles.factCard} mode="outlined">
                            <View style={styles.factContent}>
                                <View style={[styles.iconBox, { backgroundColor: fact.bg }]}>
                                    <fact.icon size={24} color={fact.color} />
                                </View>
                                <View style={styles.factTextContainer}>
                                    <Text style={styles.factTitle}>{fact.title}</Text>
                                    <Text style={styles.factDesc}>{fact.description}</Text>
                                </View>
                            </View>
                        </Card>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>Tree Species Benefits</Text>
                <View style={styles.speciesContainer}>
                    {TREE_SPECIES_BENEFITS.map((tree) => (
                        <Card key={tree.id} style={styles.speciesCard} mode="elevated">
                            <LinearGradient
                                colors={['#fff', '#F1F8E9']}
                                style={styles.speciesGradient}
                            >
                                <View style={styles.speciesHeader}>
                                    <TreeDeciduous size={24} color={tree.color} />
                                    <Text style={[styles.speciesName, { color: tree.color }]}>{tree.name}</Text>
                                </View>

                                <View style={styles.statsRow}>
                                    <Chip icon="molecule" style={[styles.statChip, { backgroundColor: '#E8F5E9' }]} textStyle={{ color: '#2E7D32', fontSize: 12 }}>
                                        O₂: {tree.oxygen}
                                    </Chip>
                                    <Chip icon="cloud" style={[styles.statChip, { backgroundColor: '#E1F5FE' }]} textStyle={{ color: '#0277BD', fontSize: 12 }}>
                                        CO₂: {tree.co2}
                                    </Chip>
                                </View>

                                <View style={styles.benefitsList}>
                                    {tree.benefits.map((benefit, index) => (
                                        <View key={index} style={styles.benefitItem}>
                                            <CheckCircle2 size={16} color={tree.color} />
                                            <Text style={styles.benefitText}>{benefit}</Text>
                                        </View>
                                    ))}
                                </View>
                            </LinearGradient>
                        </Card>
                    ))}
                </View>

                <TouchableOpacity style={styles.quizCard} onPress={() => setShowQuiz(true)}>
                    <LinearGradient
                        colors={[Colors.primary, '#004D40']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.quizGradient}
                    >
                        <View style={styles.quizContent}>
                            <BookOpen size={32} color="#fff" />
                            <View style={styles.quizText}>
                                <Text style={styles.quizTitle}>Take the Eco-Quiz</Text>
                                <Text style={styles.quizSubtitle}>Test your knowledge and earn badges!</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>

            {/* Quiz Modal */}
            <Modal visible={showQuiz} animationType="slide" transparent={false}>
                <View style={styles.quizModalContainer}>
                    <LinearGradient colors={['#E0F2F1', '#fff']} style={{ flex: 1, padding: 20 }}>
                        <View style={styles.quizHeader}>
                            <TouchableOpacity onPress={resetQuiz} style={styles.closeBtn}>
                                <X size={24} color={Colors.text} />
                            </TouchableOpacity>
                            <Text style={styles.quizHeaderTitle}>Eco Quiz</Text>
                            <View style={{ width: 24 }} />
                        </View>

                        {!showResult ? (
                            <View style={styles.questionContainer}>
                                <Text style={styles.progressText}>Question {currentQuestion + 1} of {QUESTIONS.length}</Text>
                                <View style={styles.progressBar}>
                                    <View style={[styles.progressFill, { width: `${((currentQuestion + 1) / QUESTIONS.length) * 100}%` }]} />
                                </View>

                                <Text style={styles.questionText}>{QUESTIONS[currentQuestion].question}</Text>

                                <View style={styles.optionsContainer}>
                                    {QUESTIONS[currentQuestion].options.map((option, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.optionButton}
                                            onPress={() => handleAnswer(index)}
                                        >
                                            <Text style={styles.optionText}>{option}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        ) : (
                            <View style={styles.resultContainer}>
                                <Award size={80} color={Colors.primary} />
                                <Text style={styles.resultTitle}>Quiz Complete!</Text>
                                <Text style={styles.resultScore}>You scored {score} / {QUESTIONS.length}</Text>

                                <Text style={styles.resultMessage}>
                                    {score === QUESTIONS.length ? "Perfect! You're an eco-expert! 🌿" :
                                        score > QUESTIONS.length / 2 ? "Great job! You know your stuff! 🌱" :
                                            "Keep learning! You'll get it next time! 🍃"}
                                </Text>

                                <Button mode="contained" onPress={resetQuiz} style={styles.finishBtn} buttonColor={Colors.primary}>
                                    Back to Knowledge Hub
                                </Button>
                            </View>
                        )}
                    </LinearGradient>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { padding: 20, paddingBottom: 100 },
    header: { marginTop: 10, marginBottom: 25 },
    headerTitle: { fontSize: 28, fontWeight: '800', color: '#004D40' },
    headerSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },

    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#004D40', marginBottom: 16, marginTop: 10 },

    factsContainer: { gap: 16, marginBottom: 24 },
    factCard: {
        backgroundColor: '#fff',
        borderColor: '#E0F2F1',
        borderRadius: 16,
        elevation: 0
    },
    factContent: { flexDirection: 'row', padding: 16, alignItems: 'center' },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    factTextContainer: { flex: 1 },
    factTitle: { fontSize: 16, fontWeight: '700', color: '#004D40', marginBottom: 4 },
    factDesc: { fontSize: 13, color: '#546E7A', lineHeight: 18 },

    speciesContainer: { gap: 16 },
    speciesCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 8,
        elevation: 2,
        overflow: 'hidden'
    },
    speciesGradient: { padding: 20 },
    speciesHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
    speciesName: { fontSize: 18, fontWeight: '800' },

    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    statChip: { height: 32 },

    benefitsList: { gap: 8 },
    benefitItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    benefitText: { fontSize: 13, color: '#455A64' },

    quizCard: { marginTop: 24, borderRadius: 20, overflow: 'hidden', elevation: 4 },
    quizGradient: { padding: 24 },
    quizContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    quizText: { flex: 1 },
    quizTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
    quizSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },

    // Quiz Modal Styles
    quizModalContainer: { flex: 1, backgroundColor: '#fff' },
    quizHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, marginTop: 20 },
    closeBtn: { padding: 8 },
    quizHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#004D40' },

    questionContainer: { flex: 1 },
    progressText: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8, fontWeight: '600' },
    progressBar: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, marginBottom: 30, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },

    questionText: { fontSize: 24, fontWeight: '800', color: '#004D40', marginBottom: 40, lineHeight: 32 },

    optionsContainer: { gap: 16 },
    optionButton: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E0F2F1',
        elevation: 2
    },
    optionText: { fontSize: 16, fontWeight: '600', color: '#004D40' },

    resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    resultTitle: { fontSize: 32, fontWeight: '900', color: Colors.primary, marginTop: 24, marginBottom: 8 },
    resultScore: { fontSize: 20, fontWeight: '700', color: '#004D40', marginBottom: 16 },
    resultMessage: { fontSize: 16, color: '#546E7A', textAlign: 'center', marginBottom: 40, paddingHorizontal: 20 },
    finishBtn: { borderRadius: 12, paddingVertical: 6, width: '100%' }
});
