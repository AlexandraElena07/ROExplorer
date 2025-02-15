import React, { useContext, useCallback, useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View, ScrollView, Share, Alert } from 'react-native';
import themeContext from '../../constants/themeContext';
import themeDark from '../../constants/themeDark';
import { useRoute, useNavigation } from '@react-navigation/native';
import { DescriptionText, NetworkImage, HeightSpacer, BottomButtons, ReusableText, AppBar } from '../../components/index';
import { SIZES, TEXT, COLORS } from '../../constants/theme';
import YoutubePlayer from 'react-native-youtube-iframe';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AboutCounty = () => {
    const navigation = useNavigation();

    const userTheme = useContext(themeContext);
    const currentTheme = userTheme === 'dark' ? themeDark.dark : themeDark.light;

    const [playing, setPlaying] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [userId, setUserId] = useState(null);

    const route = useRoute();
    const { item } = route.params;

    useEffect(() => {
        getUser();
    }, []);

    useEffect(() => {
        checkIfFavorite();
    }, [userId, item._id]);

    const getUser = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                //console.log('User not authenticated.');
                return;
            }
            const response = await axios.get('http://10.9.31.61:5003/api/users', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setUserId(response.data.id);
        } catch (error) {
            console.error('Error fetching user ID:', error);
            Alert.alert('Error', 'Failed to fetch user data. Please try again later.');
        }
    };

    const checkIfFavorite = async () => {
        try {
            const token = await AsyncStorage.getItem('token');

            if (!token) {
                //console.log('User not authenticated');
                return;
            }

            const response = await axios.get('http://10.9.31.61:5003/api/users/favorites', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const isFav = response.data.favorites.some(fav => fav._id === item._id && fav.type === 'County');
            setIsFavorite(isFav);
        } catch (error) {
            console.error('Error checking favorite status:', error);
        }
    };

    const handleAddToFavorites = async (itemId, itemType, countyId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const endpoint = isFavorite ? 'removeFromFavorites' : 'addToFavorites';

            if (!token) {
                Alert.alert('Error', 'You need to be logged in to add to favorite list.');
                return;
            }

            const authResponse = await axios.get('http://10.9.31.61:5003/api/check', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const response = await axios.post(`http://10.9.31.61:5003/api/users/${endpoint}`, {
                userId: authResponse.data.userId,
                itemId,
                itemType,
                countyId: countyId
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                setIsFavorite(!isFavorite);
            } else {
                Alert.alert('Error', 'Failed to update favorite status.');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong. Please try again.');
        }
    };

    const handlePressShare = async () => {
        try {
            const result = await Share.share({
                message: `Check out this place: ${item.county} - ${item.description}\n\nView more at: exp://10.9.31.61:8081/--/roexplorer://${item.county}/${item._id}`,
            });
        } catch (error) {
            alert(error.message);
        }
    };

    const onStateChange = useCallback((state) => {
        if (state === "ended") {
            setPlaying(false);
        }
    }, []);

    return (
        <View style={styles.container}>
            <ScrollView style={[{ backgroundColor: currentTheme.background }]}>
                <NetworkImage source={item.imageUrl} width={"100%"} height={260} radius={0} resizeMode={'cover'} />

                <AppBar
                    top={5}
                    right={5}
                    icon1={isFavorite ? "favorite" : "favorite-outline"}
                    color1={COLORS.grey}
                    color4={COLORS.red}
                    icon2={"ios-share"}
                    color2={COLORS.grey}
                    onPress1={() => handleAddToFavorites(item._id, 'County')}
                    onPress2={() => handlePressShare()}
                />

                <View style={styles.description}>

                    <HeightSpacer height={SIZES.small} />

                    <ReusableText
                        text={'About ' + item.county + ' County'}
                        family={'bold'}
                        size={TEXT.large}
                        color={currentTheme.color}
                    />

                    <HeightSpacer height={SIZES.small} />

                    <DescriptionText text={item.description} color={currentTheme.color} colorButton={currentTheme.color} size={TEXT.medium} />

                    <HeightSpacer height={SIZES.small} />

                    <YoutubePlayer
                        height={300}
                        play={false}
                        videoId={item.videoId}
                        onChangeState={onStateChange}
                    />
                </View>
            </ScrollView>
        </View>
    );
}

export default AboutCounty;

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    description: {
        marginHorizontal: 20,
        paddingTop: 20
    }
});
