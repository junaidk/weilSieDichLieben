/* eslint-disable no-loop-func */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from "react";
import DepartureTable from "./DepartureTable";

const DepartureDisplay = (props) => {
  const [columnData, setColumnData] = useState([]);
  const departureDataRef = useRef([]);
  const fetchCounter = useRef(0);
  const fetchIsInProgress = useRef(false);

  useEffect(() => {
    let interval;
    if (props.selectedStations.length > 0) {
      fetchDataForSelectedStations();
      interval = setInterval(() => {
        fetchDataForSelectedStations();
      }, 60000);
    } else {
      setColumnData([]);
    }
    return () => {
      clearInterval(interval);
    };
  }, [props.selectedStations]);

  const fetchDataForSelectedStations = () => {
    if (fetchIsInProgress.current) return;

    fetchIsInProgress.current = true;
    departureDataRef.current = [];
    fetchCounter.current = 0;
    for (let i = 0; i < props.selectedStations.length; i++) {
      const selectedStation = props.selectedStations[i];
      fetchDeparturesAtStop(selectedStation);
    }
  };

  const fetchDeparturesAtStop = (station) => {
    const stationId = station.id;
    const now = new Date();
    const later = new Date(
      now.getTime() + (station.when != null ? station.when : 0) * 60000
    );
    const formattedTime = later.toLocaleTimeString("de-DE", {
      hour12: false,
    });
    const url = `https://v6.bvg.transport.rest/stops/${stationId}/departures?when=${formattedTime}&results=${station.results}&suburban=${station.suburban}&subway=${station.subway}&tram=${station.tram}&bus=${station.bus}&ferry=${station.ferry}&express=${station.express}&regional=${station.regional}`;

    fetch(url)
      .then((res) => res.json())
      .then((res) => {
        if (fetchCounter.current < props.selectedStations.length) {
          departureDataRef.current.push(res);
          fetchCounter.current += 1;

          // answer for all stations received -> set column data
          if (fetchCounter.current === props.selectedStations.length) {
            const columnData = getColumnData(departureDataRef.current);
            setColumnData(columnData);
            fetchIsInProgress.current = false;
          }
        }
      });
  };

  const getColumnData = (data) => {
    const columnData = [];

    for (let i = 0; i < data.length; i++) {
      const stationData = data[i];
      for (let j = 0; j < stationData.departures.length; j++) {
        const departure = stationData.departures[j];
        const now = new Date();
        const whenDate = new Date(departure.when);
        const diffInMinutes = Math.floor(
          (whenDate.getTime() - now.getTime()) / 60000
        );

        columnData.push({
          key: `${departure.stop.id}_${j}`,
          lineName: departure.line.name,
          direction: departure.direction,
          departureName: departure.stop.name,
          when: diffInMinutes,
          remarks: departure.remarks,
        });
      }
    }

    return columnData;
  };

  const columns = [
    {
      title: "Linie",
      dataIndex: "lineName",
      key: "lineName",
    },
    {
      title: "Richtung",
      dataIndex: "direction",
      key: "direction",
    },
    {
      title: "Abfahrt von",
      dataIndex: "departureName",
      key: "departureName",
    },
    {
      title: "Abfahrt in",
      dataIndex: "when",
      key: "when",
      defaultSortOrder: "ascend",
      sorter: (a, b) => a.when - b.when,
      render: (text) => <div>{text > 0 ? text : "Jetzt"}</div>,
    },
  ];

  return (
    <div>
      <DepartureTable
        fontSize={props.fontSize}
        columns={columns}
        dataSource={columnData}
      />
    </div>
  );
};

export default DepartureDisplay;
