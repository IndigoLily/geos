#![allow(dead_code, unused_imports, unused_variables, unused_mut)]

use std::fmt::{self, Display};
use std::ops::{Deref, Add};
use std::path::PathBuf;
use std::collections::BTreeMap;
use std::str::FromStr;

use svg::node::element::path::{Command, Data, Position, Parameters, Number as SvgNumber};
use svg::node::element::tag::Path;
use svg::node::element::tag;
use svg::parser::Event;

use serde::{Serialize, Deserialize};

fn path_cmd_inner(cmd: &Command) -> Option<(&Position, &Parameters)> {
    match cmd {
        Command::Close                             => None,
        Command::Move(pos, params)                 |
        Command::Line(pos, params)                 |
        Command::HorizontalLine(pos, params)       |
        Command::VerticalLine(pos, params)         |
        Command::QuadraticCurve(pos, params)       |
        Command::SmoothQuadraticCurve(pos, params) |
        Command::CubicCurve(pos, params)           |
        Command::SmoothCubicCurve(pos, params)     |
        Command::EllipticalArc(pos, params)        => Some((pos, params)),
    }
}

#[derive(Debug, Hash, Eq, PartialEq, Ord, PartialOrd, Clone, Copy)]
#[derive(Serialize, Deserialize)]
#[serde(into = "String")]
enum MapFeatureType {
    Land,
    Forest,
    Desert,
    Swamp,
    Mountain,
    Volcano,
    Lake,
    River,
    Reef,
    City,
    Country,
}

impl FromStr for MapFeatureType {
    type Err = ();
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        use MapFeatureType::*;
        Ok(match s {
            "Land"      => Land,
            "Forests"   => Forest,
            "Deserts"   => Desert,
            "Swamps"    => Swamp,
            "Mountains" => Mountain,
            "Volcanoes" => Volcano,
            "Lakes"     => Lake,
            "Rivers"    => River,
            "Reefs"     => Reef,
            "Cities"    => City,
            "Countries" => Country,
            _ => return Err(()),
        })
    }
}

impl Display for MapFeatureType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> Result<(), std::fmt::Error> {
        use MapFeatureType::*;
        write!(f, "{}", match self {
            Land     => "land",
            Forest   => "forest",
            Desert   => "desert",
            Swamp    => "swamp",
            Mountain => "mountain",
            Volcano  => "volcano",
            Lake     => "lake",
            River    => "river",
            Reef     => "reef",
            City     => "city",
            Country  => "country",
        })
    }
}

impl Into<String> for MapFeatureType {
    fn into(self) -> String {
        self.to_string()
    }
}

#[derive(Debug, Default, Clone, Copy, PartialEq)]
#[derive(Serialize, Deserialize)]
#[serde(into = "[SvgNumber;2]")]
struct Point {
    x: SvgNumber,
    y: SvgNumber,
}

impl Add for Point {
    type Output = Point;
    fn add(self, other: Self) -> Self::Output {
        Point {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }
}

impl Into<[SvgNumber;2]> for Point {
    fn into(self) -> [SvgNumber;2] {
        [self.x, self.y]
    }
}

impl Into<Vec<SvgNumber>> for Point {
    fn into(self) -> Vec<SvgNumber> {
        vec![self.x, self.y]
    }
}

const SVG_SIZE: (SvgNumber, SvgNumber) = (36000.0, 18000.0);

fn svg_to_latlong(svg_point: &Point) -> Point {
    Point {
        x: (svg_point.x / SVG_SIZE.0 - 0.5) * 360.0, // transform from [0,36000] range to [-180,180] range
        y: (svg_point.y / SVG_SIZE.1 - 0.5) * 180.0, // transform from [0,18000] range to [-90,90] range
    }
}

type MapPath = Vec<Point>;

#[derive(Serialize, Clone)]
#[serde(into = "String")]
enum TextPosition {
    Above,
    Below,
    Left,
    Right,
}

impl Default for TextPosition {
    fn default() -> Self {
        TextPosition::Above
    }
}

impl FromStr for TextPosition {
    type Err = ();
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Ok(match s {
            "above" => TextPosition::Above,
            "below" => TextPosition::Below,
            "left"  => TextPosition::Left,
            "right" => TextPosition::Right,
            _ => return Err(()),
        })
    }
}

impl Display for TextPosition {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> Result<(), std::fmt::Error> {
        write!(f, "{}", match self {
            TextPosition::Above => "above",
            TextPosition::Below => "below",
            TextPosition::Left  => "left",
            TextPosition::Right => "right",
        })
    }
}

impl Into<String> for TextPosition {
    fn into(self) -> String {
        self.to_string()
    }
}

#[derive(Serialize)]
struct City {
    name: String,
    point: Point,
    is_capital: bool,
    position: TextPosition,
}

impl PartialEq for City {
    fn eq(&self, other: &Self) -> bool {
        self.name == other.name
    }
}

impl Eq for City {}

impl PartialOrd for City {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.name.cmp(&other.name))
    }
}

impl Ord for City {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        self.name.cmp(&other.name)
    }
}

#[derive(Serialize)]
struct Country {
    name: String,
    point: Point,
}

impl PartialEq for Country {
    fn eq(&self, other: &Self) -> bool {
        self.name == other.name
    }
}

impl Eq for Country {}

impl PartialOrd for Country {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.name.cmp(&other.name))
    }
}

impl Ord for Country {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        self.name.cmp(&other.name)
    }
}

#[derive(Default, Serialize)]
struct Map {
    paths: BTreeMap<MapFeatureType, Vec<MapPath>>,
    cities: Vec<City>,
    countries: Vec<Country>,
}

fn main() {
    // get path from first argument, i.e. second element (index 1) in env::args
    let svg_file_path = PathBuf::from(std::env::args().nth(1).unwrap());
    let svg_file_path = svg_file_path.canonicalize().unwrap();

    let mut map_feature_stack: Vec<MapFeatureType> = Vec::new();
    let mut current_feature: Option<MapFeatureType> = None;

    let mut map = Map::default();

    for event in svg::open(svg_file_path, &mut String::new()).unwrap() {
        match event {
            Event::Tag("g", tag::Type::Start, attr) => {
                if let (Some(groupmode), Some(label)) =
                    (attr.get("inkscape:groupmode"), attr.get("inkscape:label"))
                {
                    if groupmode.deref() == "layer" {
                        if let Ok(feature) = label.parse() {
                            map_feature_stack.push(feature);
                            current_feature = Some(feature);
                            eprintln!("layer \"{}\" start", map_feature_stack.last().unwrap());
                        }
                    }
                }
            },

            Event::Tag("g", tag::Type::End, _attr) => {
                if let Some(ending_layer) = map_feature_stack.pop() {
                    eprintln!("layer \"{}\" end", ending_layer);
                }
                current_feature = map_feature_stack.last().copied();
            },

            Event::Tag("circle", _, attr) => if let Some(kind @ (MapFeatureType::City | MapFeatureType::Country)) = current_feature {
                let name = String::from(attr.get("inkscape:label").unwrap().deref());
                let x: SvgNumber = attr.get("cx").unwrap().parse().unwrap();
                let y: SvgNumber = attr.get("cy").unwrap().parse().unwrap();
                let point = Point{x,y};
                let position: TextPosition = attr.get("name-position").map(|v| v.parse().ok()).flatten().unwrap_or_default();

                if kind == MapFeatureType::Country {
                    map.countries.push(Country { name, point });
                } else if kind == MapFeatureType::City {
                    let mut is_capital = false;
                    if let Some(classlist) = attr.get("class") {
                        if classlist.contains("capital") {
                            is_capital = true;
                        }
                    }
                    map.cities.push(City { name, point, is_capital, position });
                };
            },

            Event::Tag("path", tag_type, attr) => if !map_feature_stack.is_empty() {
                let data = attr.get("d").unwrap();
                let data = Data::parse(data).unwrap();

                //let misbehaving: bool = attr.get("id").map(|id| &**id == "misbehaving").unwrap_or_default();

                let mut points: Vec<Point> = Vec::new();
                let mut current_pos = Point::default();

                for cmd in data.iter() {
                    match cmd {
                        Command::Move(pos, params) | Command::Line(pos, params) => {
                            assert!(params.len() % 2 == 0);
                            let mut cmd_points: Vec<Point> = params.chunks(2).map(|pair| Point{ x: pair[0], y: pair[1] }).collect();

                            //if misbehaving {
                            //    dbg!("move/line", pos, &cmd_points);
                            //}

                            if *pos == Position::Relative {
                                for p in cmd_points.iter_mut() {
                                    *p = *p + current_pos;
                                    current_pos = *p;
                                }
                            } else {
                                current_pos = *cmd_points.last().unwrap();
                            }

                            points.extend(cmd_points);
                        },

                        Command::CubicCurve(pos, params) => {
                            assert!(params.len() % (2 * 3) == 0);
                            let mut cmd_points: Vec<Point> = params.chunks(2).map(|pair| Point{ x: pair[0], y: pair[1] }).collect();

                            //if misbehaving {
                            //    dbg!("curve", pos, &cmd_points);
                            //}

                            if *pos == Position::Relative {
                                for (i,p) in cmd_points.iter_mut().enumerate() {
                                    *p = *p + current_pos;
                                    if (i + 1) % 3 == 0 {
                                        // current_pos should be the same throught each triplet, so only change after the triplet's last point
                                        current_pos = *p;
                                    }
                                }
                            } else {
                                current_pos = *cmd_points.last().unwrap();
                            }

                            points.extend(cmd_points);
                        },

                        Command::VerticalLine(pos, params) => {
                            let p =
                                if pos == &Position::Absolute {
                                    Point { 
                                        x: current_pos.x,
                                        y: params[0],
                                    }
                                } else {
                                    Point {
                                        x: current_pos.x,
                                        y: current_pos.y + params[0],
                                    }
                                };

                            //if misbehaving {
                            //    dbg!("vline", pos, &p);
                            //}

                            current_pos = p;
                            points.push(p);
                        },

                        Command::HorizontalLine(pos, params) => {
                            let p =
                                if pos == &Position::Absolute {
                                    Point { 
                                        y: current_pos.y,
                                        x: params[0],
                                    }
                                } else {
                                    Point {
                                        y: current_pos.y,
                                        x: current_pos.x + params[0],
                                    }
                                };

                            //if misbehaving {
                            //    dbg!("hline", pos, &p);
                            //}

                            current_pos = p;
                            points.push(p);
                        },

                        Command::Close => (),

                        _ => eprintln!("unrecognized path command: {:?}", cmd)
                    }
                }

                map.paths.entry(map_feature_stack.last().unwrap().clone()).or_default().push(points);
            },

            _ => {},
        }
    }

    for feature_paths in map.paths.values_mut() {
        for path in feature_paths.iter_mut() {
            for point in path.iter_mut() {
                *point = svg_to_latlong(point);
            }
        }
    }

    for city in map.cities.iter_mut() {
        city.point = svg_to_latlong(&city.point);
    }

    map.cities.sort_unstable();

    for country in map.countries.iter_mut() {
        country.point = svg_to_latlong(&country.point);
    }

    map.countries.sort_unstable();

    for (map_feature_type, paths) in map.paths.iter() {
        println!("Feature type \"{}\" has {} paths", map_feature_type, paths.len());
    }

    let json = std::fs::File::create("map.json").unwrap();
    serde_json::to_writer_pretty(json, &map).unwrap();
}
