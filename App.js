import React, { useState, useEffect, useRef } from 'react';
import { TextInput, StyleSheet, View, Button, PermissionsAndroid, Platform, Text, Alert } from 'react-native';
import Yamap, { Marker } from 'react-native-yamap';
import * as Location from 'expo-location'; // Используем expo-location для удобства

// Инициализируем Яндекс.Карту с использованием API ключа
// YaMap.init('c4aedfb6-8abf-4daa-8b9a-a3cfc86b260b');

export default function App() {
  const [location, setLocation] = useState(null); // Состояние для хранения местоположения
  const [errorMsg, setErrorMsg] = useState(null); // Состояние для сообщений об ошибках
  const [address, setAddress] = useState(''); // Адрес для поиска
  const [destination, setDestination] = useState(null); // Состояние для конечной точки
  const mapRef = useRef(null); // Используем useRef для ссылки на карту

  // useEffect(() => {
    Yamap.init('c4aedfb6-8abf-4daa-8b9a-a3cfc86b260b');
  // }, [])

  // Функция для запроса разрешений и получения текущего местоположения
  const getUserLocation = async () => {
    try {
      // Запрос разрешений на местоположение (для Android)
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Доступ к местоположению',
            message: 'Приложению требуется доступ к вашему местоположению',
            buttonNeutral: 'Спросить позже',
            buttonNegative: 'Отмена',
            buttonPositive: 'ОК',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setErrorMsg('Доступ к местоположению был отклонен');
          return;
        }
      }

      // Получаем текущее местоположение
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Доступ к местоположению был отклонен');
        return;
      }

      let userLocation = await Location.getCurrentPositionAsync({});
      setLocation(userLocation.coords);


      if (mapRef.current) {
        mapRef.current.setCenter(
          { lat: userLocation.coords.latitude, lon: userLocation.coords.longitude }, // Центрируем на местоположении
          14, // Уровень зума (можно изменить)
          1, // Азимут (направление)
          0 // Угол наклона камеры
        );
      }


    } catch (error) {
      setErrorMsg('Не удалось получить местоположение');
    }
  };



  const searchAddress = async () => {
    if (!address) {
      Alert.alert('Ошибка', 'Введите адрес для поиска');
      return;
    }

    try {
      const apiKey = '0bcc7037-3a97-423a-92eb-cd14b9969344'; // Вставьте ваш API-ключ для Яндекс Геокодера
      const response = await fetch(
        `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&format=json&geocode=${encodeURIComponent(address)}`
      );
      const data = await response.json();

      if (data && data.response && data.response.GeoObjectCollection.featureMember.length > 0) {
        const geoObject = data.response.GeoObjectCollection.featureMember[0].GeoObject;
        const coords = geoObject.Point.pos.split(' ').map(Number);
        const latitude = coords[1];
        const longitude = coords[0];

        setDestination({ latitude, longitude });

        // Фокусировка на найденных координатах
        if (mapRef.current) {
          mapRef.current.setCenter(
            { lat: latitude, lon: longitude },
            14,
            1,
            0
          );
        }
      } else {
        Alert.alert('Ошибка', 'Не удалось найти местоположение по указанному адресу');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Произошла ошибка при поиске адреса');
    }
  };


  // const buildRoute = () => {
  //   if (!location || !destination) {
  //     Alert.alert('Ошибка', 'Необходимо получить текущее местоположение и конечный адрес');
  //     return;
  //   }

  //   const start = { lat: location.latitude, lon: location.longitude };
  //   const end = { lat: destination.latitude, lon: destination.longitude };

  //   if (mapRef.current) {
  //     mapRef.current.route(start, end, "car"); // Прокладывание маршрута между начальной и конечной точками
  //   }

  // };


  // Верхний закоментированный кусок кода я исправил на нижнюю функцию buildRoute
  // Это функция для постройки маршрута от пользователя до введеного адреса
  // Есл нужно - могу скинуть видео о работе проекта
  // Запускается с помощью команды yarn android
  // И нужен запущенный эмулятор в андроид студио
  // Остально он сделает сам
  // Если нет времени (или во вред здоровью) , не стоит. Все равно спасибо 

  const buildRoute = () => {
    if (location && destination) {
      // Строим маршрут между точками
      YaMap.route(
        {
          points: [
            { lat: location.latitude, lon: location.longitude },
            { lat: destination.latitude, lon: destination.longitude },
          ],
          style: { color: 'blue', width: 5 }, // Настройки маршрута (цвет, толщина)
        },
        (route) => {
          setRoute(route); // Сохраняем данные маршрута
          const estimatedTime = route.metadata.weight.time.text; // Оценочное время в пути
          setTime(estimatedTime); // Устанавливаем время в пути
        },
        (error) => {
          console.error('Ошибка при построении маршрута:', error); // Обработка ошибок
        }
      );
    } else {
      console.error('Не заданы текущие координаты или точка назначения');
    }
  };

  return (
    <View style={styles.container}>
      {/* Карта с текущим местоположением */}

    <Yamap
        ref={mapRef} // Связываем карту с mapRef
        style={styles.map}
        showUserPosition={true} // Включаем отображение позиции пользователя на карте
        // userLocationIcon={'path_to_custom_icon'} // Укажите путь к иконке пользователя, если необходимо
        center={location ? { lat: location.latitude, lon: location.longitude, zoom: 14 } : undefined}
      >
        {/* Если местоположение известно, отображаем маркер */}
        {location && (
          <Marker
            point={{ lat: location.latitude, lon: location.longitude }}
            // source={require('./assets/marker.png')} // Укажите путь к вашему изображению маркера
            // scale={1.5}
          />
        )}


        {destination && (
          <Marker
            point={{ lat: destination.latitude, lon: destination.longitude }}
            // source={require('./assets/destination.png')} // Укажите путь к изображению конечного маркера
            // scale={1.5}
          />
        )}

      </Yamap>

      <View style={styles.controls}>
        
        <TextInput
          style={styles.input}
          placeholder="Введите адрес для поиска"
          value={address}
          onChangeText={setAddress}
        />


        <Button title="Найти адрес" onPress={searchAddress} />


        <Button title="Найти местоположение" onPress={getUserLocation} />

        <View>
          <Button title="Проложить маршрут" onPress={buildRoute} />
        </View>

        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
      </View>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  map: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    width: '100%',
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
});
