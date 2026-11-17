import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score
import os
import timeit
import time
import random
import pickle

ci_time = 0
cd_time = 0
accuracy = 0

global xgb, label_encoder, scaler, labels, dataset


def trainModel(dataset_name):
    global xgb, label_encoder, scaler, labels, accuracy, dataset, ci_time, cd_time

    # Try training multiple times instead of recursively calling trainModel()
    max_attempts = 10

    for attempt in range(max_attempts):

        print("Training attempt {}/{}".format(attempt + 1, max_attempts))

        # Read dataset
        dataset = pd.read_csv(dataset_name)

        dataset.drop(
            [
                'Z1_CurrentFeedback',
                'Z1_DCBusVoltage',
                'Z1_OutputCurrent',
                'Z1_OutputVoltage',
                'S1_SystemInertia'
            ],
            axis=1,
            inplace=True
        )

        labels = np.unique(dataset['passed_visual_inspection'])

        label_encoder = []

        columns = dataset.columns
        types = dataset.dtypes.values

        # Encode object/string columns
        for j in range(len(types)):
            name = types[j]

            if name == 'object':
                le = LabelEncoder()

                dataset[columns[j]] = pd.Series(
                    le.fit_transform(
                        dataset[columns[j]].astype(str)
                    )
                )

                label_encoder.append([columns[j], le])

        # Fill missing numeric values
        dataset.fillna(dataset.mean(numeric_only=True), inplace=True)

        # Target
        Y = dataset['passed_visual_inspection'].values
        Y = Y.astype('int')

        # Features
        dataset.drop(['passed_visual_inspection'], axis=1, inplace=True)

        X = dataset.values

        # Shuffle
        indices = np.arange(X.shape[0])
        np.random.shuffle(indices)

        X = X[indices]
        Y = Y[indices]

        # Scaling
        scaler = MinMaxScaler(feature_range=(0, 1))
        X = scaler.fit_transform(X)

        # Train/test split
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            Y,
            test_size=0.2
        )

        # Create model
        xgb = XGBClassifier(
            max_depth=10,
            n_estimators=random.randint(10, 50)
        )

        # Train
        start = timeit.default_timer()

        xgb.fit(X_train, y_train)

        end = timeit.default_timer()

        train_time = end - start

        # Initial training time
        if ci_time == 0:
            ci_time = train_time
        else:
            cd_time = train_time

        # Prediction
        predict = xgb.predict(X_test)

        # Accuracy
        acc = accuracy_score(y_test, predict)

        print("Current model accuracy: {}".format(acc))
        print("Previous model accuracy: {}".format(accuracy))

        # --------------------------------------------------
        # New model is better
        # --------------------------------------------------
        if acc > accuracy:

            accuracy = acc

            print(
                "Model correction not detected. "
                "New maximum accuracy: {}".format(acc)
            )

            # Delete dataset after successful training
            if os.path.exists(dataset_name):
                os.remove(dataset_name)

            # Save model
            model = [
                xgb,
                label_encoder,
                scaler,
                labels,
                dataset
            ]

            os.makedirs("model", exist_ok=True)

            with open('model/model.pckl', 'wb') as f:
                pickle.dump(model, f)

            print("Model saved successfully.")

            # Save training times
            if ci_time > 0 and cd_time > 0:
                compute = "{} {}".format(ci_time, cd_time)

                with open("model/time", "wb") as file:
                    file.write(compute.encode())

            return

        # --------------------------------------------------
        # New model is worse
        # --------------------------------------------------
        else:

            print(
                "Model degradation detected. "
                "Retrying training with new train/test split..."
            )

            # Do NOT call trainModel(dataset_name) here.
            # The for-loop will perform another training attempt.

    # ------------------------------------------------------
    # Maximum attempts reached
    # ------------------------------------------------------

    print(
        "Training stopped after {} attempts. "
        "No model with better accuracy was found.".format(max_attempts)
    )

    # Keep the dataset so it can be investigated/reprocessed
    return


def checkDataset():

    while True:

        path = os.listdir("WatchData")

        dataset_name = ""
        count = 0

        for filename in path:

            full_path = os.path.join("WatchData", filename)

            if os.path.isfile(full_path):

                dataset_name = full_path
                count += 1

        if count > 0:

            time.sleep(1)

            trainModel(dataset_name)

        else:

            # Avoid continuously consuming CPU when folder is empty
            time.sleep(1)


checkDataset()